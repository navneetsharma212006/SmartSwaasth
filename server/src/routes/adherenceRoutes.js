const express = require("express");
const adherence = require("../controllers/adherenceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/log", adherence.logIntake);
router.get("/history", adherence.getHistory);

module.exports = router;
