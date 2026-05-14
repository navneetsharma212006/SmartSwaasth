const { GoogleGenerativeAI } = require("@google/generative-ai");
const Medicine = require("../models/Medicine");
const AdherenceLog = require("../models/AdherenceLog");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

  const lines = ["Patient's Current Medicine Profile:"];

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
      daysUntilExpiry === null
        ? ""
        : daysUntilExpiry < 0
        ? " ⚠️ EXPIRED"
        : daysUntilExpiry <= 30
        ? ` ⚠️ Expires in ${daysUntilExpiry} days`
        : "";

    // Adherence stats for this medicine
    const logs = await AdherenceLog.find({
      medicineId: m._id,
      date: { $gte: thirtyDaysAgo },
    }).lean();

    const takenCount = logs.filter((l) => l.status === "taken").length;
    const adherencePct =
      logs.length > 0 ? Math.round((takenCount / logs.length) * 100) : null;

    lines.push(
      `\n• Medicine: ${m.name}` +
      (m.dosageInstructions ? `\n  Instructions: ${m.dosageInstructions}` : "") +
      `\n  Dosage: ${m.dosagePerDay || 1}x per day` +
      (m.dosageTimes?.length ? `\n  Times: ${m.dosageTimes.join(", ")}` : "") +
      `\n  Expiry: ${expiryDate}${expiryStatus}` +
      (adherencePct !== null ? `\n  Adherence (last 30 days): ${adherencePct}%` : "") +
      (m.complianceRisk ? `\n  Risk Level: ${m.complianceRisk.toUpperCase()}` : "")
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

    const patientContext = await buildPatientContext(userId);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are SwaasthSaathi, a friendly and knowledgeable AI healthcare assistant built into SmartSwaasth — an intelligent medication adherence platform.

Your role is to help patients:
- Understand their prescribed medicines (side effects, how to take them, precautions)
- Interpret their adherence data and compliance scores
- Get general health and wellness advice
- Understand drug interactions
- Manage their medication schedules better

Always use the patient's actual medicine data below when answering personalized questions.
Speak in simple, clear language. Be warm, encouraging, and supportive.
Always end health-critical answers with: "Please consult your doctor for personalized medical advice."
Do NOT diagnose diseases or prescribe new medications.

--- PATIENT'S LIVE MEDICINE DATA ---
${patientContext}
--- END OF PATIENT DATA ---

If asked about medicines not in their profile, answer generally.
If asked non-health questions, politely redirect to health topics.`,
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
    console.error("[AI] Gemini error:", err.message);
    next(err);
  }
};
