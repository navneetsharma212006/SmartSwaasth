import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiLoader, FiX, FiCalendar, FiActivity } from "react-icons/fi";
import { getMedicine, logAdherence, fetchAdherenceHistory } from "../lib/api.js";

export default function DailyChecklistPage() {
  const { medicineId } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!medicineId) return;
    setLoading(true);
    setError("");
    try {
      const [doc, logs] = await Promise.all([
        getMedicine(medicineId),
        fetchAdherenceHistory(medicineId)
      ]);
      setMedicine(doc);
      setHistory(logs);
    } catch {
      setError("Could not load data.");
    } finally {
      setLoading(false);
    }
  }, [medicineId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLog = async (status) => {
    setSaving(true);
    setError("");
    try {
      await logAdherence({ medicineId, status });
      await load(); // Reload history and medicine risk profile
    } catch {
      setError("Failed to save log.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-black/60">
        <FiLoader className="mx-auto animate-spin text-2xl" />
        <p className="mt-2 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-black/60 hover:text-black"
          >
            <FiArrowLeft /> Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Adherence Log</h1>
          <p className="mt-1 text-lg font-medium text-black/80">{medicine?.name}</p>
          <p className="mt-1 text-sm text-black/60">
            Log your doses and track your compliance over time.
          </p>
        </div>
        {medicine?.complianceRisk && (
          <div className={`rounded-xl border px-4 py-2 text-sm font-medium ${
            medicine.complianceRisk === 'high' ? 'border-red-200 bg-red-50 text-red-800' : 
            medicine.complianceRisk === 'moderate' ? 'border-amber-200 bg-amber-50 text-amber-800' : 
            'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2">
              <FiActivity />
              <span>{medicine.complianceScore}% Adherence</span>
            </div>
            <p className="text-xs opacity-70 mt-0.5 capitalize">{medicine.complianceRisk} Compliance Risk</p>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">Log a dose</h2>
        <p className="text-sm text-black/60 mb-4">Did you take your medicine just now?</p>
        <div className="flex gap-3">
          <button
            onClick={() => handleLog("taken")}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            <FiCheck /> I took it
          </button>
          <button
            onClick={() => handleLog("missed")}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-black/15 py-3 text-black/70 transition hover:bg-black/5 disabled:opacity-50"
          >
            <FiX /> I missed it
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FiCalendar /> History
        </h2>
        {history.length === 0 ? (
          <p className="text-center py-8 text-black/40 border border-dashed border-black/10 rounded-2xl">
            No logs yet.
          </p>
        ) : (
          <div className="space-y-3">
            {history.map(log => (
              <div key={log._id} className="flex items-center justify-between p-4 rounded-xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${log.status === 'taken' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {log.status === 'taken' ? <FiCheck /> : <FiX />}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{log.status}</p>
                    <p className="text-xs text-black/50">{new Date(log.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-xs font-medium px-2 py-1 bg-black/5 rounded uppercase tracking-wider text-black/60">
                  {log.medicineId?.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/5"
        >
          <FiArrowLeft /> Back to dashboard
        </button>
      </div>
    </div>
  );
}
