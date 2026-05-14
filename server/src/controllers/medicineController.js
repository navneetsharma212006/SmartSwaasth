const path = require("path");
const fs = require("fs");
const Medicine = require("../models/Medicine");
const { runOcr } = require("../utils/ocrClient");
const { scheduleReminderRefresh } = require("../services/reminderSchedulers");

function buildImageUrl(req, filename) {
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
}

/** @returns {{ error: string } | { dosagePerDay: number, dosageTimes: string[] }} */
function parseDosageFields(body) {
  const rawCount = body?.dosagePerDay ?? body?.dosagesPerDay;
  let times = body?.dosageTimes;
  if (typeof times === "string") {
    try {
      times = JSON.parse(times);
    } catch {
      times = null;
    }
  }
  if (rawCount == null || rawCount === "") {
    return { error: "Dosage (times per day) is required: choose 1 to 3." };
  }
  const perDay = Number(rawCount);
  if (!Number.isInteger(perDay) || perDay < 1 || perDay > 3) {
    return { error: "Dosage must be between 1 and 3 times per day." };
  }
  if (!Array.isArray(times) || times.length !== perDay) {
    return { error: `Enter exactly ${perDay} dose time(s).` };
  }
  const normalized = [];
  const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/;
  for (let i = 0; i < perDay; i++) {
    const t = times[i];
    if (t == null || String(t).trim() === "") {
      return { error: "Each dose needs a time." };
    }
    const s = String(t).trim();
    if (!timeRe.test(s)) {
      return { error: "Use valid times in 24-hour format (HH:MM)." };
    }
    const [h, m] = s.split(":").map(Number);
    normalized.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
  }
  return { dosagePerDay: perDay, dosageTimes: normalized };
}

// POST /api/upload-medicine  -> just stores the image and returns its URL
exports.uploadMedicine = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    res.json({
      filename: req.file.filename,
      imageUrl: buildImageUrl(req, req.file.filename),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/extract-medicine -> uploads, runs OCR, saves to DB
exports.extractMedicine = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const filePath = req.file.path;
    const ocr = await runOcr(filePath);

    if (!ocr.medicineName && !ocr.expiryDate) {
      return res.status(422).json({
        error: "Could not extract medicine info. Try a clearer image.",
        ocr,
      });
    }

    const dosage = parseDosageFields(req.body);
    if (dosage.error) {
      return res.status(400).json({ error: dosage.error });
    }

    let expiry = null;
    if (ocr.expiryDate) {
      // "YYYY-MM" or "YYYY-MM-DD"
      expiry = new Date(
        ocr.expiryDate.length === 7 ? `${ocr.expiryDate}-01` : ocr.expiryDate
      );
    }

    const doc = await Medicine.create({
      userId: req.user.id,
      name: ocr.medicineName || "Unknown",
      expiryDate: expiry || new Date("2099-12-31"),
      imageUrl: buildImageUrl(req, req.file.filename),
      rawText: ocr.rawText,
      entryMethod: "scan",
      dosagePerDay: dosage.dosagePerDay,
      dosageTimes: dosage.dosageTimes,
      dailyDosageReminderEnabled: false,
      expiryReminderEnabled: false,
      schedule: {
        enabled: false,
        times: dosage.dosageTimes,
        dosage: `${dosage.dosagePerDay}× daily`,
      },
    });

    scheduleReminderRefresh();
    res.json({ medicine: doc, ocr });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      // keep file; useful for debugging
    }
    next(err);
  }
};

// POST /api/medicines/manual — save medicine details without scanning
exports.createManualMedicine = async (req, res, next) => {
  try {
    const { name, expiryDate, tabletsInPacket, syrupAmountMl } = req.body;
    const trimmed = name != null ? String(name).trim() : "";
    if (!trimmed) {
      return res.status(400).json({ error: "Medicine name is required" });
    }
    if (!expiryDate) {
      return res.status(400).json({ error: "Expiry date is required" });
    }
    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime())) {
      return res.status(400).json({ error: "Invalid expiry date" });
    }

    const dosage = parseDosageFields(req.body);
    if (dosage.error) {
      return res.status(400).json({ error: dosage.error });
    }

    const payload = {
      userId: req.user.id,
      name: trimmed,
      expiryDate: expiry,
      entryMethod: "manual",
      dosagePerDay: dosage.dosagePerDay,
      dosageTimes: dosage.dosageTimes,
      dailyDosageReminderEnabled: false,
      expiryReminderEnabled: false,
      schedule: {
        enabled: false,
        times: dosage.dosageTimes,
        dosage: `${dosage.dosagePerDay}× daily`,
      },
    };

    if (tabletsInPacket != null && tabletsInPacket !== "") {
      const n = Number(tabletsInPacket);
      if (!Number.isNaN(n) && n >= 0) payload.tabletsInPacket = n;
    }
    if (syrupAmountMl != null && syrupAmountMl !== "") {
      const n = Number(syrupAmountMl);
      if (!Number.isNaN(n) && n >= 0) payload.syrupAmountMl = n;
    }

    const medicine = await Medicine.create(payload);
    scheduleReminderRefresh();
    res.status(201).json({ medicine });
  } catch (err) {
    next(err);
  }
};

// GET /api/medicines
exports.listMedicines = async (req, res, next) => {
  try {
    const items = await Medicine.find({ userId: req.user.id }).sort({ expiryDate: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// GET /api/medicine/:id
exports.getMedicineById = async (req, res, next) => {
  try {
    const doc = await Medicine.findOne({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// PUT /api/medicine/:id
exports.updateMedicine = async (req, res, next) => {
  try {
    const {
      name,
      expiryDate,
      dosageInstructions,
      schedule,
      tabletsInPacket,
      syrupAmountMl,
      weeklyChecklist,
      dosagePerDay,
      dosageTimes,
      dailyDosageReminderEnabled,
      expiryReminderEnabled,
    } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (expiryDate !== undefined) update.expiryDate = new Date(expiryDate);
    if (dosageInstructions !== undefined) update.dosageInstructions = dosageInstructions;
    if (schedule !== undefined) update.schedule = schedule;
    if (tabletsInPacket !== undefined && tabletsInPacket !== "") {
      const n = Number(tabletsInPacket);
      if (!Number.isNaN(n) && n >= 0) update.tabletsInPacket = n;
    }
    if (syrupAmountMl !== undefined && syrupAmountMl !== "") {
      const n = Number(syrupAmountMl);
      if (!Number.isNaN(n) && n >= 0) update.syrupAmountMl = n;
    }
    if (dosagePerDay !== undefined && dosageTimes !== undefined) {
      const dosage = parseDosageFields({ dosagePerDay, dosageTimes });
      if (dosage.error) {
        return res.status(400).json({ error: dosage.error });
      }
      update.dosagePerDay = dosage.dosagePerDay;
      update.dosageTimes = dosage.dosageTimes;
    }
    if (dailyDosageReminderEnabled !== undefined) {
      update.dailyDosageReminderEnabled = Boolean(dailyDosageReminderEnabled);
    }
    if (expiryReminderEnabled !== undefined) {
      update.expiryReminderEnabled = Boolean(expiryReminderEnabled);
    }
    if (weeklyChecklist !== undefined && weeklyChecklist !== null) {
      const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const allowed = new Set(["unset", "taken", "missed"]);
      const existing = await Medicine.findById(req.params.id).lean();
      const prev = existing?.weeklyChecklist || {};
      const merged = {};
      for (const d of days) {
        const base = allowed.has(prev[d]) ? prev[d] : "unset";
        merged[d] = base;
      }
      for (const d of days) {
        const v = weeklyChecklist[d];
        if (v != null && allowed.has(v)) merged[d] = v;
      }
      update.weeklyChecklist = merged;
    }
    const doc = await Medicine.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, 
      update, 
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Not found" });
    scheduleReminderRefresh();
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/medicine/:id
exports.deleteMedicine = async (req, res, next) => {
  try {
    const doc = await Medicine.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: "Not found" });

    if (doc.imageUrl) {
      const filename = doc.imageUrl.split("/uploads/")[1];
      if (filename) {
        const filePath = path.join(__dirname, "..", "..", "uploads", filename);
        fs.promises.unlink(filePath).catch(() => {});
      }
    }
    scheduleReminderRefresh();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const User = require("../models/User");

// CAREGIVER FUNCTIONS

// GET /api/medicines/patient/:patientId
exports.listPatientMedicines = async (req, res, next) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Only caregivers can access patient medicines" });
    }

    const { patientId } = req.params;
    const caregiver = await User.findById(req.user.id);
    
    if (!caregiver.patients.includes(patientId)) {
      return res.status(403).json({ error: "You are not authorized to manage this patient" });
    }

    const items = await Medicine.find({ userId: patientId }).sort({ expiryDate: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// POST /api/medicines/patient/:patientId/extract
exports.extractPatientMedicine = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "No image provided" });
    }

    const { rawText, parsedData } = await ocrService.extractTextAndParse(
      req.file.path
    );

    let expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    if (parsedData.expiryDate) {
      const pDate = new Date(parsedData.expiryDate);
      if (!isNaN(pDate.getTime())) {
        expiryDate = pDate;
      }
    }

    const dosage = parseDosage(req.body);

    const med = new Medicine({
      userId: patientId,
      doctorId: req.user.id,
      name: parsedData.medicineName || "Unknown Medicine",
      expiryDate,
      imageUrl: `/uploads/${req.file.filename}`,
      rawText,
      entryMethod: "scan",
      dosagePerDay: dosage.dosagePerDay,
      dosageTimes: dosage.dosageTimes,
      dailyDosageReminderEnabled: false,
      expiryReminderEnabled: false,
      schedule: {
        enabled: true,
        times: dosage.dosageTimes,
        dosage: `${dosage.dosagePerDay}× daily`,
      },
    });

    await med.save();

    res.json({
      medicine: med,
      ocr: { rawText },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/medicines/patient/:patientId/manual
exports.createPatientManualMedicine = async (req, res, next) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Only caregivers can add patient medicines" });
    }

    const { patientId } = req.params;
    const caregiver = await User.findById(req.user.id);
    
    if (!caregiver.patients.includes(patientId)) {
      return res.status(403).json({ error: "You are not authorized to manage this patient" });
    }

    const { name, expiryDate, tabletsInPacket, syrupAmountMl } = req.body;
    const trimmed = name != null ? String(name).trim() : "";
    if (!trimmed) {
      return res.status(400).json({ error: "Medicine name is required" });
    }
    if (!expiryDate) {
      return res.status(400).json({ error: "Expiry date is required" });
    }
    const expiry = new Date(expiryDate);
    if (Number.isNaN(expiry.getTime())) {
      return res.status(400).json({ error: "Invalid expiry date" });
    }

    const dosage = parseDosageFields(req.body);
    if (dosage.error) {
      return res.status(400).json({ error: dosage.error });
    }

    const payload = {
      userId: patientId,
      doctorId: req.user.id,
      name: trimmed,
      expiryDate: expiry,
      entryMethod: "manual",
      dosagePerDay: dosage.dosagePerDay,
      dosageTimes: dosage.dosageTimes,
      dailyDosageReminderEnabled: false,
      expiryReminderEnabled: false,
      schedule: {
        enabled: true,
        times: dosage.dosageTimes,
        dosage: `${dosage.dosagePerDay}× daily`,
      },
    };

    if (tabletsInPacket != null && tabletsInPacket !== "") {
      const n = Number(tabletsInPacket);
      if (!Number.isNaN(n) && n >= 0) payload.tabletsInPacket = n;
    }
    if (syrupAmountMl != null && syrupAmountMl !== "") {
      const n = Number(syrupAmountMl);
      if (!Number.isNaN(n) && n >= 0) payload.syrupAmountMl = n;
    }

    const medicine = await Medicine.create(payload);
    scheduleReminderRefresh();
    res.status(201).json({ medicine });
  } catch (err) {
    next(err);
  }
};

// PUT /api/medicines/patient/:patientId/:medicineId
exports.updatePatientMedicine = async (req, res, next) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Only caregivers can update patient medicines" });
    }

    const { patientId, medicineId } = req.params;
    const caregiver = await User.findById(req.user.id);
    
    if (!caregiver.patients.includes(patientId)) {
      return res.status(403).json({ error: "You are not authorized to manage this patient" });
    }

    const update = req.body;
    delete update.userId;

    const doc = await Medicine.findOneAndUpdate(
      { _id: medicineId, userId: patientId }, 
      update, 
      { new: true }
    );
    
    if (!doc) return res.status(404).json({ error: "Medicine not found" });
    scheduleReminderRefresh();
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/medicines/patient/:patientId/:medicineId
exports.deletePatientMedicine = async (req, res, next) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Only caregivers can delete patient medicines" });
    }

    const { patientId, medicineId } = req.params;
    const caregiver = await User.findById(req.user.id);
    
    if (!caregiver.patients.includes(patientId)) {
      return res.status(403).json({ error: "You are not authorized to manage this patient" });
    }

    const doc = await Medicine.findOneAndDelete({ _id: medicineId, userId: patientId });
    if (!doc) return res.status(404).json({ error: "Medicine not found" });

    scheduleReminderRefresh();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/medicines/prescribed-by/:doctorId
exports.listDoctorPrescribedMedicines = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const items = await Medicine.find({ 
      userId: req.user.id, 
      doctorId: doctorId 
    }).sort({ expiryDate: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

