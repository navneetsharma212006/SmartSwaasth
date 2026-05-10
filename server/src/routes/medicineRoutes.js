const express = require("express");
const upload = require("../middleware/upload");
const c = require("../controllers/medicineController");
const ic = require("../controllers/interactionCheckController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/upload-medicine", upload.single("image"), c.uploadMedicine);
router.post("/extract-medicine", upload.single("image"), c.extractMedicine);
router.post("/medicines/manual", c.createManualMedicine);
router.post("/medicine/check-interaction", ic.checkInteraction);
router.post("/medicines/interactions", ic.checkInteraction);

router.get("/medicines", c.listMedicines);
router.get("/medicine/:id", c.getMedicineById);
router.put("/medicine/:id", c.updateMedicine);
router.delete("/medicine/:id", c.deleteMedicine);

// Caregiver routes
router.get("/medicines/patient/:patientId", c.listPatientMedicines);
router.post("/medicines/patient/:patientId/manual", c.createPatientManualMedicine);
router.put("/medicines/patient/:patientId/:medicineId", c.updatePatientMedicine);
router.delete("/medicines/patient/:patientId/:medicineId", c.deletePatientMedicine);


module.exports = router;
