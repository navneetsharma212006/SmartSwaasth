const express = require("express");
const auth = require("../controllers/authController");
const user = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", auth.register);
router.post("/login", auth.login);
router.get("/me", authMiddleware, auth.getMe);

// Caregiver routes
router.post("/add-patient", authMiddleware, user.addPatient);
router.get("/patients", authMiddleware, user.getPatients);
router.post("/generate-otp", authMiddleware, user.generateOTP);
router.post("/join-doctor", authMiddleware, user.joinDoctor);


module.exports = router;
