const express = require("express");
const router = express.Router();
const axios = require("axios");
const protect = require("../middleware/authMiddleware");
const Medicine = require("../models/Medicine");
const AdherenceLog = require("../models/AdherenceLog");

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_NAME = "gemini-1.5-flash";

/* ── Build patient medicine context from DB ─────────────── */
async function buildPatientContext(userId) {
  try {
    // REMOVED .lean() so that decryption hooks in Medicine model fire correctly!
    const medicines = await Medicine.find({ userId });
    if (!medicines || medicines.length === 0) return "Patient has no medicines registered yet.";

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

      // Log check
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
  } catch (err) {
    console.error("[SwaasthSaathi Context Error]", err.message);
    return "Note: There was an error loading your specific medicine details, but I can still help with general questions.";
  }
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
      return res.status(503).json({ 
        error: "SwaasthSaathi is not configured. Please add a GEMINI_API_KEY in Render." 
      });
    }

    const patientContext = await buildPatientContext(req.user.id);

    const systemPrompt =
      `You are SwaasthSaathi, a warm AI health assistant for SmartSwaasth (India). ` +
      `Help patients with medicines, health, nutrition, and wellness. ` +
      `Match the user's language (English/Hindi/Hinglish). Use simple terms. ` +
      `For emergencies, advise seeing a doctor. Use the patient data below if relevant.\n\n` +
      `--- PATIENT MEDICINE DATA ---\n${patientContext}\n--- END DATA ---`;

    // Format history for Gemini API
    const contents = history.map((h) => ({
      role: h.role === "model" ? "model" : "user",
      parts: [{ text: h.parts }],
    }));

    // Inject system prompt into the first message or as a separate system instruction
    // We'll use the official system_instruction field
    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        ...contents,
        { role: "user", parts: [{ text: message }] }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 800,
      },
    };

    const url = `${GEMINI_BASE_URL}/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const { data } = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 45000,
    });

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I processed your request but couldn't generate a text response. Please try again.";

    res.json({ reply });
  } catch (err) {
    console.error("[SwaasthSaathi API Error]", err.response?.data || err.message);
    
    const apiError = err.response?.data?.error?.message || err.message;
    
    // Check for specific error types
    if (apiError.includes("API key not valid") || apiError.includes("leaked")) {
      return res.status(401).json({ error: "The Gemini API key is invalid or has been disabled. Please update it in Render settings." });
    }

    res.status(500).json({
      error: `SwaasthSaathi Error: ${apiError}`,
    });
  }
});

router.get("/diag", protect, (req, res) => {
  const key = process.env.GEMINI_API_KEY || "";
  res.json({
    hasKey: !!key,
    length: key.length,
    prefix: key.substring(0, 7), // "AIzaSy..."
    suffix: key.substring(key.length - 4),
  });
});

module.exports = router;
