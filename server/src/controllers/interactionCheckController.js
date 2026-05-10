const { checkInteractionsByNames } = require("../services/rxnormService");

const Medicine = require("../models/Medicine");

exports.checkInteraction = async (req, res, next) => {
  try {
    let names = req.body?.medicineNames ?? req.body?.names;
    const ids = req.body?.medicineIds;

    if (ids && Array.isArray(ids)) {
      const medicines = await Medicine.find({ _id: { $in: ids } });
      const fetchedNames = medicines.map((m) => m.name);
      names = names ? [...names, ...fetchedNames] : fetchedNames;
    }

    if (typeof names === "string") {
      names = [names];
    }

    if (!Array.isArray(names) || names.length === 0) {
      // If no names and no ids provided, return empty array instead of 400
      // to avoid dashboard errors when no medicines exist
      return res.json([]);
    }

    const result = await checkInteractionsByNames(names);
    res.json(result);
  } catch (err) {
    const code = err.statusCode || 500;
    if (code >= 500) {
      console.error("[check-interaction]", err.message);
    }
    return res.status(code).json({
      error: err.message || "Interaction check failed",
    });
  }
};
