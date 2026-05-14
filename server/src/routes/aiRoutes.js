const express = require("express");
const router = express.Router();
const axios = require("axios");
const protect = require("../middleware/authMiddleware");
const Medicine = require("../models/Medicine");

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function buildPatientContext(userId) {
  try {
    const medicines = await Medicine.find({ userId });
    if (!medicines || medicines.length === 0) return "No medicines registered.";
    return medicines.map(m => `• ${m.name} (${m.dosagePerDay || 1}x/day)`).join("\n");
  } catch (err) { return "Context error."; }
}

router.post("/chat", protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing API Key." });

    const context = await buildPatientContext(req.user.id);

    const payload = {
      system_instruction: {
        parts: [{ text: `You are SwaasthSaathi, an AI health assistant. Patient medicines:\n${context}` }]
      },
      contents: [
        ...history.map(h => ({ role: h.role === "model" ? "model" : "user", parts: [{ text: h.parts }] })),
        { role: "user", parts: [{ text: message }] }
      ],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    };

    const url = `${GEMINI_API_URL}?key=${apiKey}`;
    const { data } = await axios.post(url, payload, { timeout: 30000 });
    
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a reply.";
    res.json({ reply });
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error("AI Error:", errMsg);
    res.status(500).json({ error: `SwaasthSaathi Error: ${errMsg}` });
  }
});

module.exports = router;
