/**
 * RxNorm: resolve names → RxCUI (NLM RxNav REST).
 * Drug–drug interaction: RxNav /interaction/list was discontinued Jan 2024 (404).
 * We pair-check using openFDA SPL "drug_interactions" text: each pair (A,B) scans A's and B's labels for the other drug name (heuristic; not a substitute for clinical review).
 */
const axios = require("axios");

const RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST";
const OPENFDA_LABEL = "https://api.fda.gov/drug/label.json";
const OPENFDA_API_KEY = process.env.OPENFDA_API_KEY || "";

function openfdaParams(extra) {
  const params = { ...extra };
  if (OPENFDA_API_KEY) params.api_key = OPENFDA_API_KEY;
  return params;
}

/**
 * @param {string} name
 * @returns {Promise<{ inputName: string, rxcui: string | null, resolved: boolean, error?: string }>}
 */
async function nameToRxcui(name) {
  const inputName = String(name || "").trim();
  if (!inputName) {
    return { inputName: "", rxcui: null, resolved: false, error: "Empty name" };
  }

  const enc = encodeURIComponent(inputName);

  try {
    const r1 = await axios.get(`${RXNAV_BASE}/rxcui.json?name=${enc}`, {
      timeout: 20000,
      validateStatus: () => true,
    });
    if (r1.status === 200) {
      const ids = r1.data?.idGroup?.rxnormId;
      const id = Array.isArray(ids) ? ids[0] : ids;
      if (id) {
        return { inputName, rxcui: String(id), resolved: true };
      }
    }
  } catch (err) {
    /* fall through */
  }

  try {
    const r2 = await axios.get(
      `${RXNAV_BASE}/approximateTerm.json?term=${enc}&maxEntries=5`,
      { timeout: 20000 }
    );
    const cands = r2.data?.approximateGroup?.candidate;
    const arr = Array.isArray(cands) ? cands : cands ? [cands] : [];
    const best = arr.find((c) => c?.rxcui);
    if (best?.rxcui) {
      return { inputName, rxcui: String(best.rxcui), resolved: true };
    }
  } catch (err) {
    return {
      inputName,
      rxcui: null,
      resolved: false,
      error: err.response?.data?.message || err.message || "RxNorm lookup failed",
    };
  }

  return {
    inputName,
    rxcui: null,
    resolved: false,
    error: "No RxCUI found for this name in RxNorm",
  };
}

async function rxnormPreferredName(rxcui) {
  try {
    const res = await axios.get(`${RXNAV_BASE}/rxcui/${encodeURIComponent(rxcui)}/properties.json`, {
      timeout: 15000,
    });
    return res.data?.properties?.name || null;
  } catch {
    return null;
  }
}

function collectDrugInteractionChunks(results) {
  const chunks = [];
  for (const row of results || []) {
    const di = row.drug_interactions;
    if (!di) continue;
    const parts = Array.isArray(di) ? di : [di];
    for (const p of parts) {
      if (typeof p === "string" && p.trim()) chunks.push(p.trim());
    }
  }
  return chunks;
}

/**
 * @param {string} rxcui
 * @param {string} [fallbackName] user or RxNorm display name for openFDA generic search
 * @returns {Promise<string>}
 */
async function fetchOpenfdaDrugInteractionsText(rxcui, fallbackName) {
  if (!rxcui) return "";
  const chunks = [];
  try {
    const res = await axios.get(OPENFDA_LABEL, {
      params: openfdaParams({
        search: `openfda.rxcui:${rxcui}`,
        limit: 8,
      }),
      timeout: 25000,
      validateStatus: () => true,
    });
    if (res.status === 200) {
      chunks.push(...collectDrugInteractionChunks(res.data?.results));
    }
  } catch {
    /* continue to fallback */
  }

  if (chunks.length === 0) {
    const rxName = (await rxnormPreferredName(rxcui)) || fallbackName;
    if (rxName) {
      try {
        const esc = rxName.replace(/"/g, '\\"');
        const res2 = await axios.get(OPENFDA_LABEL, {
          params: openfdaParams({
            search: `openfda.generic_name:"${esc}"`,
            limit: 8,
          }),
          timeout: 25000,
          validateStatus: () => true,
        });
        if (res2.status === 200) {
          chunks.push(...collectDrugInteractionChunks(res2.data?.results));
        }
      } catch {
        /* ignore */
      }
    }
  }

  return chunks.join("\n\n");
}

function normalizeForMatch(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\b(sodium|hydrochloride|hcl|mg|tablet|tablets|oral)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Heuristic: does label interaction text mention the other drug?
 * @param {string} haystack
 * @param {string} drugLabel
 */
function labelMentionsDrug(haystack, drugLabel) {
  const h = normalizeForMatch(haystack);
  if (!h || h.length < 8) return false;
  const d = normalizeForMatch(drugLabel);
  if (!d || d.length < 2) return false;
  if (h.includes(d)) return true;
  const tokens = d.split(" ").filter((t) => t.length > 3);
  if (tokens.length === 0) return false;
  return tokens.every((t) => h.includes(t));
}

function extractSnippet(haystack, drugLabel, maxLen = 360) {
  const h = haystack;
  const idx = h.toLowerCase().indexOf(String(drugLabel).toLowerCase().slice(0, 12));
  if (idx < 0) {
    return h.slice(0, maxLen) + (h.length > maxLen ? "…" : "");
  }
  const start = Math.max(0, idx - 80);
  return h.slice(start, start + maxLen) + (h.length > start + maxLen ? "…" : "");
}

function guessSeverity(text) {
  const t = String(text || "").toLowerCase();
  if (
    /contraindicat|do not co-?admin|avoid use|serious|life-?threatening|fatal|major bleed/i.test(
      t
    )
  ) {
    return "major";
  }
  if (/caution|monitor|consider|may increase|may decrease|adjust dose|reduce dose/i.test(t)) {
    return "moderate";
  }
  if (/interaction|concomitant|concurrently|inhibit|induce/i.test(t)) {
    return "low";
  }
  return "none";
}

/**
 * @param {string[]} medicineNames
 */
async function checkInteractionsByNames(medicineNames) {
  const raw = Array.isArray(medicineNames) ? medicineNames : [];
  const trimmed = raw
    .map((n) => String(n || "").trim())
    .filter(Boolean);
  const uniqueByKey = [];
  const seen = new Set();
  for (const n of trimmed) {
    const k = n.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    uniqueByKey.push(n);
  }

  if (uniqueByKey.length < 2) {
    const err = new Error("Add at least two different medicines to check interactions.");
    err.statusCode = 400;
    throw err;
  }

  const resolved = [];
  for (const name of uniqueByKey) {
    resolved.push(await nameToRxcui(name));
  }

  const ok = resolved.filter((r) => r.rxcui);
  if (ok.length < 2) {
    return {
      medicines: resolved,
      pairs: [],
      meta: {
        rxnavInteractionApiNote:
          "NLM RxNav /REST/interaction/list was discontinued in 2024; pairwise checks use openFDA SPL drug_interactions text.",
        pairCount: 0,
        warning:
          "At least two medicines must resolve to an RxCUI to run pairwise checks. Add clearer names or verify spelling.",
      },
    };
  }

  const labelCache = {};
  for (const r of ok) {
    if (!labelCache[r.rxcui]) {
      labelCache[r.rxcui] = await fetchOpenfdaDrugInteractionsText(
        r.rxcui,
        r.inputName
      );
    }
  }

  const pairs = [];
  for (let i = 0; i < ok.length; i++) {
    for (let j = i + 1; j < ok.length; j++) {
      const a = ok[i];
      const b = ok[j];
      const textA = labelCache[a.rxcui] || "";
      const textB = labelCache[b.rxcui] || "";
      const aInB = labelMentionsDrug(textB, a.inputName);
      const bInA = labelMentionsDrug(textA, b.inputName);
      const hasSignal = aInB || bInA;
      const primaryText = bInA ? textA : aInB ? textB : textA || textB;
      let snippet = "";
      if (hasSignal) {
        if (bInA) snippet = extractSnippet(textA, b.inputName);
        else if (aInB) snippet = extractSnippet(textB, a.inputName);
        else snippet = extractSnippet(primaryText, b.inputName);
      }

      let severity = "none";
      let summary = "No explicit cross-reference found between these names in FDA label drug-interaction text.";
      if (!textA && !textB) {
        summary =
          "No FDA label drug-interaction section was found for one or both drugs (by RxCUI). This is not proof of safety—consult a clinician or pharmacist.";
        severity = "unknown";
      } else if (hasSignal) {
        severity = guessSeverity(primaryText);
        if (bInA && aInB) {
          summary = `Both labels may reference the other drug (openFDA SPL). Review snippets below.`;
        } else if (bInA) {
          summary = `${b.inputName} may be discussed in ${a.inputName} labeling (openFDA SPL).`;
        } else {
          summary = `${a.inputName} may be discussed in ${b.inputName} labeling (openFDA SPL).`;
        }
      }

      pairs.push({
        drugA: a.inputName,
        drugB: b.inputName,
        rxcuiA: a.rxcui,
        rxcuiB: b.rxcui,
        hasSignal,
        severity,
        summary,
        snippet: hasSignal ? snippet : undefined,
        checkedVia: "rxnorm-rxcui + openfda-label-crossmatch",
      });
    }
  }

  return {
    medicines: resolved,
    pairs,
    meta: {
      rxnavInteractionApiNote:
        "NLM RxNav /REST/interaction/list was discontinued in 2024; pairwise checks use openFDA SPL drug_interactions text.",
      pairCount: pairs.length,
    },
  };
}

module.exports = {
  nameToRxcui,
  checkInteractionsByNames,
};
