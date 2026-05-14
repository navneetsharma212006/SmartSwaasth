const express = require("express");
const router = express.Router();
const axios = require("axios");
const { protect } = require("../middleware/authMiddleware");
const Medicine = require("../models/Medicine");
const AdherenceLog = require("../models/AdherenceLog");

// Gemini REST endpoint — no npm package needed, just axios (already installed)
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/* ── Build patient medicine context from DB ─────────────── */
async function buildPatientContext(userId) {
  const medicines = await Medicine.find({ userId }).lean();
  if (!medicines.length) return "Patient has no medicines registered yet.";

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const lines = ["=== Patient Medicine Profile ==="];
  for (const m of medicines) {
    const expiry = m.expiryDate
      ? new Date(m.expiryDate).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        })
      : "Unknown";
    const daysLeft = m.expiryDate
      ? Math.ceil((new Date(m.expiryDate) - Date.now()) / 86400000)
      : null;
    const expiryTag =
      daysLeft === null ? "" :
      daysLeft < 0 ? " [EXPIRED]" :
      daysLeft <= 30 ? ` [Expires in ${daysLeft} days]` : "";

    const logs = await AdherenceLog.find({
      medicineId: m._id,
      date: { $gte: thirtyDaysAgo },
    }).lean();
    const takenPct = logs.length
      ? Math.round(
          (logs.filter((l) => l.status === "taken").length / logs.length) * 100
        )
      : null;

    lines.push(
      `\n• ${m.name}` +
      (m.dosageInstructions ? `\n  How to take: ${m.dosageInstructions}` : "") +
      `\n  Dose: ${m.dosagePerDay || 1}x/day` +
      (m.dosageTimes?.length ? ` at ${m.dosageTimes.join(", ")}` : "") +
      `\n  Expiry: ${expiry}${expiryTag}` +
      (takenPct !== null ? `\n  30-day adherence: ${takenPct}%` : "") +
      (m.complianceRisk ? `\n  Risk: ${m.complianceRisk.toUpperCase()}` : "")
    );
  }
  return lines.join("\n");
}

/* ── POST /api/ai/chat ──────────────────────────────────── */
router.post("/chat", protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: "AI service not configured." });
    }

    const patientContext = await buildPatientContext(req.user.id);

    const systemPrompt =
      `You are SwaasthSaathi, a warm AI health assistant for SmartSwaasth (India). ` +
      `Help patients with ANYTHING — medicines, health, nutrition, lifestyle, mental wellness, or general questions. Always be helpful. ` +
      `Use the patient's real medicine data below when relevant. Speak simply and encouragingly. ` +
      `Match the user's language (English/Hindi/Hinglish). For emergencies, advise immediate medical help.\n\n` +
      `--- PATIENT MEDICINE DATA ---\n${patientContext}\n--- END ---`;

    // Build Gemini REST API contents array
    const contents = [
      // Inject system prompt as first user turn (Gemini REST supports system_instruction separately)
      ...history.map((h) => ({
        role: h.role === "model" ? "model" : "user",
        parts: [{ text: h.parts }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const { data } = await axios.post(
      `${GEMINI_URL}?key=${apiKey}`,
      payload,
      { headers: { "Content-Type": "application/json" }, timeout: 30000 }
    );

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response. Please try again.";

    res.json({ reply });
  } catch (err) {
    console.error("[SwaasthSaathi]", err.response?.data || err.message);
    res.status(500).json({
      error: "SwaasthSaathi is temporarily unavailable. Please try again.",
    });
  }
});

module.exports = router;
