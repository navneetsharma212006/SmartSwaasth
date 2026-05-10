import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCheckCircle,
  FiInfo,
  FiLoader,
  FiPlus,
  FiShield,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";
import { checkMedicineInteractions } from "../lib/api.js";

const STORAGE_KEY = "smart_swaasth_interaction_selection_v1";

function loadStored() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStored(list) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

/** Simple verdict for non-experts */
function getPairVerdict(p) {
  const sev = (p.severity || "").toLowerCase();
  if (p.severity === "unknown" || (!p.hasSignal && sev === "unknown")) {
    return {
      key: "unknown",
      label: "Not sure",
      headline: "We couldn’t fully check this pair",
      explain:
        "Official prescribing text wasn’t available for one or both medicines, so we couldn’t compare them automatically. Ask a doctor or pharmacist before using them together.",
      border: "border-slate-200",
      bg: "bg-slate-50",
      icon: FiInfo,
      iconClass: "text-slate-600",
    };
  }
  if (p.hasSignal && sev === "major") {
    return {
      key: "harmful",
      label: "Harmful risk",
      headline: "These medicines may be dangerous together",
      explain:
        "Drug labeling suggests a serious interaction (for example, a large drop in blood pressure or other severe effects). Do not combine them unless your clinician tells you it is safe and how to monitor.",
      border: "border-red-300",
      bg: "bg-red-50",
      icon: FiAlertTriangle,
      iconClass: "text-red-600",
    };
  }
  if (p.hasSignal && (sev === "moderate" || sev === "low")) {
    return {
      key: "caution",
      label: "Caution",
      headline: "Possible interaction — get advice first",
      explain:
        "Labeling suggests these drugs can interact. Talk to your pharmacist or doctor before using them on the same day or changing doses.",
      border: "border-amber-300",
      bg: "bg-amber-50",
      icon: FiAlertTriangle,
      iconClass: "text-amber-700",
    };
  }
  return {
    key: "ok",
    label: "No clear warning",
    headline: "We didn’t find a matching warning in our check",
    explain:
      "We didn’t see one drug called out in the other’s interaction section. That does not prove the combination is safe — always confirm with a health professional.",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    icon: FiCheckCircle,
    iconClass: "text-emerald-700",
  };
}

function summarizePairVerdicts(pairs) {
  const list = pairs || [];
  const keys = list.map((p) => getPairVerdict(p).key);
  return {
    harmful: keys.filter((k) => k === "harmful").length,
    caution: keys.filter((k) => k === "caution").length,
    unknown: keys.filter((k) => k === "unknown").length,
    ok: keys.filter((k) => k === "ok").length,
    total: keys.length,
  };
}

function appendPickup(prev, pickup) {
  if (!pickup?.name) return prev;
  const id = pickup.id;
  const nameTrim = pickup.name.trim();
  const exists = prev.some(
    (x) =>
      (id && x.id === id) ||
      x.name.trim().toLowerCase() === nameTrim.toLowerCase()
  );
  if (exists) return prev;
  return [...prev, { id: id || null, name: nameTrim }];
}

export default function MedicineInteractionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(() => loadStored());
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    saveStored(selected);
  }, [selected]);

  useEffect(() => {
    const pickup = location.state?.pickup;
    if (!pickup?.name) return;
    setSelected((prev) => appendPickup(prev, pickup));
    navigate("/medicine-interaction", { replace: true, state: {} });
  }, [location.state, navigate]);

  const goPickMedicines = () => {
    navigate("/dashboard?pickForInteraction=1");
  };

  const removeAt = (index) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
    setResults(null);
    setError("");
  };

  const runCheck = async () => {
    const names = selected.map((s) => s.name).filter(Boolean);
    const unique = [...new Set(names.map((n) => n.trim().toLowerCase()))].map(
      (k) => names.find((n) => n.trim().toLowerCase() === k)
    );
    if (unique.length < 2) {
      setError("Add at least two different medicines, then run the check.");
      setResults(null);
      return;
    }
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const data = await checkMedicineInteractions(unique);
      setResults(data);
    } catch (e) {
      setError(e.response?.data?.error || "Could not check interactions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black"
      >
        <FiArrowLeft /> Dashboard
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Medicine Interaction Checker
          </h1>
          <p className="mt-2 text-sm text-black/60">
            Add medicines from your list, then check pairwise signals using RxNorm
            (RxCUI) and FDA label interaction text. Not a substitute for professional
            advice.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/50">
          Selected medicines
        </h2>
        {selected.length === 0 ? (
          <p className="mt-3 text-sm text-black/55">
            No medicines yet. Use <strong>Add medicine</strong> to open your dashboard
            and pick one. Use the <strong>+</strong> button to repeat for more drugs.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-black/10 rounded-lg border border-black/10">
            {selected.map((row, idx) => (
              <li
                key={`${row.id || "noid"}-${row.name}-${idx}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <span className="font-medium text-black/90">{row.name}</span>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-100"
                >
                  <FiTrash2 /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={goPickMedicines}
            className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Add medicine
          </button>
          <button
            type="button"
            onClick={goPickMedicines}
            title="Add another medicine from your dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/15 bg-black text-white hover:bg-black/90"
          >
            <FiPlus className="text-lg" />
          </button>
          <button
            type="button"
            disabled={loading || selected.length < 2}
            onClick={runCheck}
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" /> Checking…
              </>
            ) : (
              <>
                <FiShield /> Check interaction
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <FiAlertTriangle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {results && (
        <div className="mt-8 space-y-6">
          <h2 className="text-lg font-semibold">What this means for you</h2>

          {results.meta?.warning && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">We couldn’t compare every medicine</p>
                <p className="mt-1 text-amber-900/90">{results.meta.warning}</p>
              </div>
            </div>
          )}

          {(() => {
            const { harmful, caution, unknown, ok, total } = summarizePairVerdicts(
              results.pairs
            );
            if (!total) return null;
            let tone = "border-emerald-200 bg-emerald-50 text-emerald-950";
            let title = "Summary";
            let body = "";
            if (harmful > 0) {
              tone = "border-red-300 bg-red-50 text-red-950";
              title = "At least one combination looks risky";
              body = `${harmful} pair(s) are flagged as potentially dangerous in the information we could read. Do not assume it is safe to combine them — speak to a clinician and read the red cards below.`;
            } else if (caution > 0) {
              tone = "border-amber-300 bg-amber-50 text-amber-950";
              title = "Some combinations need a professional check";
              body = `${caution} pair(s) may interact. Ask your doctor or pharmacist before using them together or changing dose.`;
            } else if (unknown > 0 && ok === 0 && caution === 0 && harmful === 0) {
              tone = "border-slate-200 bg-slate-50 text-slate-900";
              title = "We couldn’t confirm these combinations automatically";
              body =
                "We didn’t have enough official label text to judge every pair. Please confirm with a pharmacist or doctor before combining.";
            } else if (unknown > 0 && ok > 0) {
              tone = "border-slate-200 bg-slate-50 text-slate-900";
              title = "Mixed results";
              body =
                "Some pairs could not be checked from the data we had; others showed no clear interaction warning. Treat any “not sure” pair as needing professional advice.";
            } else {
              title = "No strong interaction warnings in this check";
              body =
                "We didn’t find obvious interaction call-outs for these pairs in the label text we could access. That does not prove they are safe together — always follow your prescriber’s advice.";
            }
            return (
              <div className={`rounded-xl border-2 px-4 py-4 ${tone}`}>
                <p className="text-base font-semibold">{title}</p>
                <p className="mt-2 text-sm leading-relaxed opacity-95">{body}</p>
              </div>
            );
          })()}

          <details className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-medium text-black/80">
              Medicines we looked up ({results.medicines?.length || 0})
            </summary>
            <ul className="mt-3 space-y-2">
              {results.medicines?.map((m, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2"
                >
                  <span className="font-medium">{m.inputName}</span>
                  {m.resolved ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-800">
                      <FiCheckCircle /> Recognized in drug database
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-800">
                      <FiXCircle /> {m.error || "Not found — try another spelling"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-black/50">
              Technical IDs (RxCUI) are hidden unless you need them for your clinician.
            </p>
          </details>

          <div>
            <h3 className="text-sm font-semibold text-black/80">
              Each combination ({results.pairs?.length || 0})
            </h3>
            <ul className="mt-4 space-y-4">
              {results.pairs?.map((p, i) => {
                const verdict = getPairVerdict(p);
                const Icon = verdict.icon;
                return (
                  <li
                    key={i}
                    className={`overflow-hidden rounded-xl border-2 shadow-sm ${verdict.border} ${verdict.bg}`}
                  >
                    <div className="flex gap-3 p-4 sm:gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ${verdict.iconClass}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                              verdict.key === "harmful"
                                ? "border-red-300 bg-red-100 text-red-900"
                                : verdict.key === "caution"
                                  ? "border-amber-300 bg-amber-100 text-amber-900"
                                  : verdict.key === "unknown"
                                    ? "border-slate-300 bg-white text-slate-800"
                                    : "border-emerald-300 bg-emerald-100 text-emerald-900"
                            }`}
                          >
                            {verdict.label}
                          </span>
                        </div>
                        <p className="mt-2 text-lg font-semibold leading-snug text-black">
                          {p.drugA} + {p.drugB}
                        </p>
                        <p className="mt-1 text-base font-medium text-black/90">
                          {verdict.headline}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-black/75">
                          {verdict.explain}
                        </p>
                        {p.snippet && (
                          <details className="mt-3 rounded-lg border border-black/10 bg-white/80">
                            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-black/70">
                              Show technical excerpt (FDA label text)
                            </summary>
                            <pre className="max-h-48 overflow-auto border-t border-black/10 px-3 py-2 text-xs leading-relaxed text-black/65 whitespace-pre-wrap">
                              {p.snippet}
                            </pre>
                          </details>
                        )}
                        <p className="mt-3 text-[10px] text-black/40">
                          Source: FDA prescribing information (openFDA), matched via RxNorm
                          names. Not medical advice.
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <details className="rounded-lg border border-black/10 bg-black/[0.02] px-3 py-2 text-xs text-black/55">
            <summary className="cursor-pointer font-medium">
              About this checker (technical)
            </summary>
            <p className="mt-2 pr-2">
              {results.meta?.rxnavInteractionApiNote} This tool compares official label
              wording, not your full health history.
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
