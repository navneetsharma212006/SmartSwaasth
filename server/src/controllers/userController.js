const User = require("../models/User");
const ConnectionOTP = require("../models/ConnectionOTP");


exports.addPatient = async (req, res, next) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Only caregivers can add patients" });
    }

    const { patientEmail } = req.body;
    const patient = await User.findOne({ email: patientEmail, role: "patient" });
    
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Add patient to caregiver
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { patients: patient._id }
    });

    // Add caregiver to patient
    await User.findByIdAndUpdate(patient._id, {
      $addToSet: { caregivers: req.user.id }
    });

    res.json({ message: "Patient added successfully", patient: { id: patient._id, name: patient.name } });
  } catch (err) {
    next(err);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("patients", "name email");
    res.json(user.patients);
  } catch (err) {
    next(err);
  }
};

exports.getDoctors = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate("caregivers", "name email");
    res.json(user.caregivers);
  } catch (err) {
    next(err);
  }
};

exports.generateOTP = async (req, res, next) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Only caregivers can generate connection codes" });
    }

    // Delete any existing OTP for this caregiver
    await ConnectionOTP.deleteMany({ caregiverId: req.user.id });

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const newOTP = new ConnectionOTP({
      caregiverId: req.user.id,
      otp,
    });

    await newOTP.save();

    res.json({ otp });
  } catch (err) {
    next(err);
  }
};

exports.joinDoctor = async (req, res, next) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ error: "Only patients can join a doctor" });
    }

    const { otp } = req.body;
    if (!otp || otp.length !== 4) {
      return res.status(400).json({ error: "Please enter a valid 4-digit code" });
    }

    const connection = await ConnectionOTP.findOne({ otp });

    if (!connection) {
      return res.status(404).json({ error: "Invalid or expired connection code. Ask your doctor for a new code." });
    }

    const caregiverId = connection.caregiverId;

    // Check if already connected — treat as success so user isn't confused
    const patient = await User.findById(req.user.id);
    if (patient.caregivers && patient.caregivers.map(String).includes(String(caregiverId))) {
      const doctor = await User.findById(caregiverId, "name");
      return res.json({ message: `You are already connected to Dr. ${doctor?.name || "your doctor"}` });
    }

    // Link patient to caregiver
    await User.findByIdAndUpdate(caregiverId, {
      $addToSet: { patients: req.user.id }
    });

    // Link caregiver to patient
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { caregivers: caregiverId }
    });

    // Don't delete the OTP — let TTL handle expiry so the code stays valid
    // for the full 10-minute window (in case patient retries or another patient joins)

    const doctor = await User.findById(caregiverId, "name");
    res.json({ message: `Successfully connected to Dr. ${doctor?.name || "your doctor"}!`, doctorName: doctor?.name });
  } catch (err) {
    next(err);
  }
};

exports.disconnectPatient = async (req, res, next) => {
  try {
    if (req.user.role !== "caregiver") {
      return res.status(403).json({ error: "Only caregivers can disconnect patients" });
    }

    const { patientId } = req.params;

    // Remove patient from caregiver
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { patients: patientId }
    });

    // Remove caregiver from patient
    await User.findByIdAndUpdate(patientId, {
      $pull: { caregivers: req.user.id }
    });

    res.json({ message: "Patient disconnected successfully" });
  } catch (err) {
    next(err);
  }
};

exports.disconnectDoctor = async (req, res, next) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({ error: "Only patients can disconnect doctors" });
    }

    const { doctorId } = req.params;

    // Remove doctor from patient
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { caregivers: doctorId }
    });

    // Remove patient from doctor
    await User.findByIdAndUpdate(doctorId, {
      $pull: { patients: req.user.id }
    });

    res.json({ message: "Doctor disconnected successfully" });
  } catch (err) {
    next(err);
  }
};
