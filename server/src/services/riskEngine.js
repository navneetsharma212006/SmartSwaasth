const AdherenceLog = require("../models/AdherenceLog");
const Medicine = require("../models/Medicine");

/**
 * Analyzes adherence history for a specific medicine and updates its risk profile.
 * @param {string} medicineId 
 */
async function analyzeRisk(medicineId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await AdherenceLog.find({
    medicineId,
    date: { $gte: thirtyDaysAgo },
  }).sort({ date: -1 });

  if (logs.length === 0) return;

  const totalPossible = logs.length;
  const takenCount = logs.filter(l => l.status === "taken").length;
  const score = Math.round((takenCount / totalPossible) * 100);

  // Heuristic for risk
  let risk = "low";
  const lastThree = logs.slice(0, 3);
  const consecutiveMissed = lastThree.length === 3 && lastThree.every(l => l.status === "missed");

  if (score < 60 || consecutiveMissed) {
    risk = "high";
  } else if (score < 85) {
    risk = "moderate";
  }

  await Medicine.findByIdAndUpdate(medicineId, {
    complianceScore: score,
    complianceRisk: risk,
  });

  return { score, risk };
}

module.exports = { analyzeRisk };
