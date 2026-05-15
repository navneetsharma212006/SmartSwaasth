const express = require("express");
const upload = require("../middleware/upload");
const c = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// Upload a report for a patient
router.post("/reports/patient/:patientId", upload.single("file"), c.uploadReport);

// Get all reports for a patient
router.get("/reports/patient/:patientId", c.getPatientReports);

// Retry AI analysis
router.post("/reports/:reportId/analyze", c.analyzeReport);

// Delete report
router.delete("/reports/:reportId", c.deleteReport);

module.exports = router;
