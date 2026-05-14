const Medicine = require("../models/Medicine");
const AdherenceLog = require("../models/AdherenceLog");

/**
 * Lazily get the Gemini client — avoids crash if env not loaded at module init time.
 */
let _genAI = null;
function getGenAI() {
  if (!_genAI) {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set in environment variables.");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

/**
 * Build a rich context string from the patient's real medicine data.
 */
async function buildPatientContext(userId) {
  const medicines = await Medicine.find({ userId }).lean();

  if (medicines.length === 0) {
    return "The patient currently has no medicines registered in SmartSwaasth.";
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const lines = ["=== Patient's Current Medicine Profile ==="];

  for (const m of medicines) {
    const expiryDate = m.expiryDate
      ? new Date(m.expiryDate).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        })
      : "Unknown";

    const daysUntilExpiry = m.expiryDate
      ? Math.ceil((new Date(m.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    const expiryStatus =
      daysUntilExpiry === null ? "" :
      daysUntilExpiry < 0 ? " [EXPIRED]" :
      daysUntilExpiry <= 30 ? ` [Expires in ${daysUntilExpiry} days]` : "";

    const logs = await AdherenceLog.find({
      medicineId: m._id,
      date: { $gte: thirtyDaysAgo },
    }).lean();

    const takenCount = logs.filter((l) => l.status === "taken").length;
    const adherencePct =
      logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : null;

    lines.push(
      `\nMedicine: ${m.name}` +
      (m.dosageInstructions ? `\n  Instructions: ${m.dosageInstructions}` : "") +
      `\n  Dosage: ${m.dosagePerDay || 1}x per day` +
      (m.dosageTimes?.length ? `\n  Scheduled times: ${m.dosageTimes.join(", ")}` : "") +
      `\n  Expiry: ${expiryDate}${expiryStatus}` +
      (adherencePct !== null ? `\n  Adherence last 30 days: ${adherencePct}%` : "") +
      (m.complianceRisk ? `\n  AI Risk Level: ${m.complianceRisk.toUpperCase()}` : "")
    );
  }

  return lines.join("\n");
}

/**
 * POST /api/ai/chat
 * Body: { message: string, history: [{role, parts}] }
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get patient's live medicine context from DB
    const patientContext = await buildPatientContext(userId);

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are SwaasthSaathi, a warm and knowledgeable AI healthcare assistant built into SmartSwaasth — an intelligent medication adherence platform for Indian patients.

Your role is to help patients with ANYTHING they ask — whether it's about their medicines, general health, wellness, nutrition, lifestyle, mental health, or even everyday questions. Always be helpful and never refuse to answer.

When answering questions related to the patient's medicines, USE the patient data provided below.
When answering general questions (food, exercise, sleep, stress, etc.), give helpful general advice.
When asked medical questions beyond their profile, answer with general medical knowledge and recommend consulting a doctor for personalization.

Speak in simple, clear, and friendly language. Be encouraging and supportive like a trusted health companion.
Use the patient's actual medicine data to give personalized answers whenever relevant.
For serious symptoms or emergencies, always advise seeking immediate medical help.

--- PATIENT'S LIVE MEDICINE DATA ---
${patientContext}
--- END OF PATIENT DATA ---

Always respond in the same language the user writes in (Hindi, English, Hinglish — match the user's style).
Keep responses concise but complete. Use bullet points or numbered lists when listing multiple items.`,
    });

    // Convert stored history to Gemini format
    const geminiHistory = history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (err) {
    console.error("[SwaasthSaathi] Gemini error:", err.message);
    next(err);
  }
};
