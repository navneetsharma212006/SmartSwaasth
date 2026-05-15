import { useState, useEffect } from "react";
import { FiFileText, FiUploadCloud, FiTrash2, FiRefreshCw, FiExternalLink, FiCpu, FiAlertTriangle } from "react-icons/fi";
import { uploadPatientReport, getPatientReports, analyzeReportAI, deleteReport } from "../lib/api";
import ReactMarkdown from "react-markdown";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ReportList({ patientId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getPatientReports(patientId);
      setReports(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [patientId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;
    
    setUploading(true);
    setError("");
    
    try {
      await uploadPatientReport(patientId, file, title);
      setShowUpload(false);
      setFile(null);
      setTitle("");
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRetryAI = async (reportId) => {
    try {
      await analyzeReportAI(reportId);
      fetchReports();
    } catch (err) {
      alert("AI analysis failed again.");
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteReport(reportId);
        fetchReports();
      } catch (err) {
        alert("Failed to delete report.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FiFileText /> Medical Reports
        </h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-black/90 transition-colors flex items-center gap-2"
        >
          <FiUploadCloud /> {showUpload ? "Cancel" : "Upload Report"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-900 rounded-xl flex items-center gap-2 text-sm border border-red-100">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {showUpload && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm animate-in slide-in-from-top-2">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-black/50">Upload New Report</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Blood Test Results (Jan 2024)"
                className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-black/5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">File (PDF or Image)</label>
              <input
                type="file"
                required
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-black/5"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-black/90 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              {uploading ? <><FiRefreshCw className="animate-spin" /> Analyzing & Uploading...</> : "Upload & Analyze with AI"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-black/40">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-black/20 text-center">
          <FiFileText className="text-4xl text-black/10 mx-auto mb-4" />
          <p className="text-black/50">No reports uploaded yet.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => (
            <div key={report._id} className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm overflow-hidden">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-black/5">
                <div>
                  <h3 className="font-bold text-lg">{report.title}</h3>
                  <div className="text-sm text-black/50 mt-1 flex flex-wrap gap-3">
                    <span>Uploaded: {new Date(report.createdAt).toLocaleDateString()}</span>
                    <span>By: {report.uploaderId?.name || "Unknown"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`${API_BASE}${report.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium border border-blue-100"
                  >
                    View File <FiExternalLink />
                  </a>
                  <button
                    onClick={() => handleDelete(report._id)}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors border border-red-100"
                    title="Delete Report"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2 mb-3">
                  <FiCpu /> AI Analysis Brief
                </h4>
                {report.aiSummary ? (
                  <div className="prose prose-sm max-w-none text-black/80 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                    <ReactMarkdown>{report.aiSummary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="bg-black/5 p-4 rounded-xl text-sm text-black/60 flex items-center justify-between border border-black/10">
                    <span>AI analysis not available for this report.</span>
                    <button 
                      onClick={() => handleRetryAI(report._id)}
                      className="px-3 py-1 bg-white border border-black/10 rounded-md hover:bg-black/5 font-medium flex items-center gap-1"
                    >
                      <FiRefreshCw /> Retry Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
