const AdherenceLog = require("../models/AdherenceLog");
const { analyzeRisk } = require("../services/riskEngine");

exports.logIntake = async (req, res, next) => {
  try {
    const { medicineId, status, date, dosageTime } = req.body;
    const userId = req.user.id;

    const log = await AdherenceLog.create({
      medicineId,
      userId,
      status,
      date: date || new Date(),
      dosageTime,
    });

    // Run AI risk analysis after logging
    await analyzeRisk(medicineId);

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { medicineId } = req.query;
    const userId = req.user.id;
    
    const query = { userId };
    if (medicineId) query.medicineId = medicineId;

    const logs = await AdherenceLog.find(query)
      .sort({ date: -1 })
      .limit(100)
      .populate("medicineId", "name");

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
