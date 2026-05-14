const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Medicine = require("../models/Medicine");
const AdherenceLog = require("../models/AdherenceLog");

/* ── Lazy-loaded Gemini client ─────────────────────────── */
let _genAI = null;
async function getGenAI() {
  if (!_genAI) {
    // Dynamic import supports both CJS and ESM builds of the package
    const mod = await import("@google/generative-ai");
    const GoogleGenerativeAI = mod.GoogleGenerativeAI || mod.default?.GoogleGenerativeAI;
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY env var is missing");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

/* ── Build patient context from DB ─────────────────────── */
async function buildPatientContext(userId) {
  const medicines = await Medicine.find({ userId }).lean();
  if (!medicines.length) return "Patient has no medicines registered yet.";

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const lines = ["=== Patient Medicine Profile ==="];
  for (const m of medicines) {
    const expiry = m.expiryDate
      ? new Date(m.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : "Unknown";
    const daysLeft = m.expiryDate
      ? Math.ceil((new Date(m.expiryDate) - Date.now()) / 86400000)
      : null;
    const expiryTag =
      daysLeft === null ? "" : daysLeft < 0 ? " [EXPIRED]" : daysLeft <= 30 ? ` [Expires in ${daysLeft} days]` : "";

    const logs = await AdherenceLog.find({ medicineId: m._id, date: { $gte: thirtyDaysAgo } }).lean();
    const takenPct = logs.length
      ? Math.round((logs.filter((l) => l.status === "taken").length / logs.length) * 100)
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
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

    const patientContext = await buildPatientContext(req.user.id);
    const genAI = await getGenAI();

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
        `You are SwaasthSaathi, a warm AI health assistant for SmartSwaasth (India). ` +
        `Help patients with ANYTHING — medicines, health, nutrition, lifestyle, mental wellness, or general questions. Always be helpful. ` +
        `Use the patient's real medicine data below when relevant. Speak simply and encouragingly. ` +
        `Match the user's language (English/Hindi/Hinglish). For emergencies, advise immediate medical help.\n\n` +
        `--- PATIENT MEDICINE DATA ---\n${patientContext}\n--- END ---`,
    });

    const geminiHistory = history.map((h) => ({ role: h.role, parts: [{ text: h.parts }] }));
    const chatSession = model.startChat({ history: geminiHistory });
    const result = await chatSession.sendMessage(message);

    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error("[SwaasthSaathi]", err.message);
    res.status(500).json({ error: "SwaasthSaathi is temporarily unavailable. Please try again." });
  }
});

module.exports = router;
