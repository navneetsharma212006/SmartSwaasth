const Report = require("../models/Report");
const User = require("../models/User");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const fileToGenerativePart = (filePath, mimeType) => {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
};

const generateAIAnalysis = async (filePath, mimeType) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  // Use gemini-1.5-flash as it supports multimodality and PDFs
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    You are an expert medical AI assistant.
    Please analyze this medical report and provide a brief, easy-to-understand summary for the doctor.
    Include key findings, abnormal values (if any), and potential areas of concern.
    Do not invent information. If the document is illegible or not a medical report, state that clearly.
    Format your response in Markdown, using bullet points for key findings.
  `;

  const filePart = fileToGenerativePart(filePath, mimeType);

  const result = await model.generateContent([prompt, filePart]);
  return result.response.text();
};

exports.uploadReport = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: "Please upload a file (PDF or Image)" });
    }

    if (!title) {
      return res.status(400).json({ error: "Please provide a title for the report" });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Ensure uploader is authorized (must be the patient themselves or a connected caregiver)
    if (req.user.role === "patient" && req.user.id !== patientId) {
      return res.status(403).json({ error: "Not authorized to upload reports for this patient" });
    }
    
    if (req.user.role === "caregiver" && !req.user.patients.includes(patientId)) {
        return res.status(403).json({ error: "You are not connected to this patient" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;

    const report = new Report({
      patientId,
      uploaderId: req.user.id,
      title,
      fileUrl,
      fileType,
    });

    await report.save();

    // Try AI Analysis
    try {
      const summary = await generateAIAnalysis(req.file.path, fileType);
      report.aiSummary = summary;
      await report.save();
    } catch (aiError) {
      console.error("[AI Report Analysis Error]:", aiError.message);
      // We don't block the upload if AI fails, just leave summary empty or log error
      report.aiSummary = "AI Analysis failed or is unavailable at this time. Please try again later.";
      await report.save();
    }

    res.status(201).json({ message: "Report uploaded successfully", report });
  } catch (err) {
    next(err);
  }
};

exports.getPatientReports = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Authorization
    if (req.user.role === "patient" && req.user.id !== patientId) {
      return res.status(403).json({ error: "Not authorized to view these reports" });
    }
    
    if (req.user.role === "caregiver" && !req.user.patients.includes(patientId)) {
        return res.status(403).json({ error: "You are not connected to this patient" });
    }

    const reports = await Report.find({ patientId }).sort({ createdAt: -1 }).populate("uploaderId", "name role");
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

exports.analyzeReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Authorization
    if (req.user.role === "patient" && req.user.id !== report.patientId.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }
    if (req.user.role === "caregiver" && !req.user.patients.includes(report.patientId.toString())) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const filePath = require("path").join(__dirname, "..", "..", "uploads", report.fileUrl.replace("/uploads/", ""));
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    const summary = await generateAIAnalysis(filePath, report.fileType);
    report.aiSummary = summary;
    await report.save();

    res.json({ message: "Report analyzed successfully", summary: report.aiSummary });
  } catch (err) {
    console.error("[AI Retry Error]:", err.message);
    res.status(500).json({ error: "AI Analysis failed: " + err.message });
  }
};

exports.deleteReport = async (req, res, next) => {
    try {
        const { reportId } = req.params;
        const report = await Report.findById(reportId);
        
        if (!report) return res.status(404).json({ error: "Report not found" });
        
        if (req.user.id !== report.uploaderId.toString() && req.user.role !== "patient") {
             // Let patients delete any report on their profile, but caregivers can only delete what they uploaded?
             // Actually, let's keep it simple: only the uploader or the patient can delete it.
             if (req.user.id !== report.patientId.toString()) {
                  return res.status(403).json({ error: "Not authorized to delete this report" });
             }
        }
        
        // Remove file
        const filePath = require("path").join(__dirname, "..", "..", "uploads", report.fileUrl.replace("/uploads/", ""));
        if (fs.existsSync(filePath)) {
             fs.unlinkSync(filePath);
        }
        
        await Report.findByIdAndDelete(reportId);
        res.json({ message: "Report deleted successfully" });
    } catch(err) {
        next(err);
    }
}
