const express = require("express");
const router = express.Router();
const axios = require("axios");
const protect = require("../middleware/authMiddleware");
const Medicine = require("../models/Medicine");
const AdherenceLog = require("../models/AdherenceLog");

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1";
const MODEL_NAME = "gemini-1.5-flash";

/* ── Build patient medicine context from DB ─────────────── */
async function buildPatientContext(userId) {
  try {
    const medicines = await Medicine.find({ userId });
    if (!medicines || medicines.length === 0) return "Patient has no medicines registered yet.";

    const lines = ["=== Patient Medicine Profile ==="];
    for (const m of medicines) {
      lines.push(
        `\n• ${m.name}` +
        (m.dosageInstructions ? `\n  How to take: ${m.dosageInstructions}` : "") +
        `\n  Dose: ${m.dosagePerDay || 1}x/day`
      );
    }
    return lines.join("\n");
  } catch (err) {
    return "Medicine context unavailable.";
  }
}

/* ── POST /api/ai/chat ──────────────────────────────────── */
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(503).json({ error: "API Key missing in Render environment." });

    const patientContext = await buildPatientContext(req.user.id);

    const systemPrompt =
      `You are SwaasthSaathi, an AI health assistant for SmartSwaasth. ` +
      `Help the patient with their health and medicines. ` +
      `Context: ${patientContext}`;

    // Super-compatible payload for v1
    const payload = {
      contents: [
        { role: "user", parts: [{ text: `System Instruction: ${systemPrompt}` }] },
        { role: "model", parts: [{ text: "Understood. I am SwaasthSaathi. How can I help you today?" }] },
        ...history.map((h) => ({
          role: h.role === "model" ? "model" : "user",
          parts: [{ text: h.parts }],
        })),
        { role: "user", parts: [{ text: message }] },
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    };

    const url = `${GEMINI_BASE_URL}/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const { data } = await axios.post(url, payload, { timeout: 30000 });

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    res.json({ reply });
  } catch (err) {
    console.error("[SwaasthSaathi Error]", err.response?.data || err.message);
    const apiError = err.response?.data?.error?.message || err.message;
    res.status(500).json({ error: `AI Error: ${apiError}` });
  }
});

router.get("/diag", protect, (req, res) => {
  const key = process.env.GEMINI_API_KEY || "";
  res.json({ hasKey: !!key, length: key.length, prefix: key.substring(0, 7) });
});

module.exports = router;
