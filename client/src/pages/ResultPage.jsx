import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiGrid, FiAlertTriangle } from "react-icons/fi";
import StatusBadge from "../components/StatusBadge.jsx";
import InteractionAlert from "../components/InteractionAlert.jsx";
import ScheduleManager from "../components/ScheduleManager.jsx";
import { formatDate, getExpiryStatus } from "../lib/expiry.js";
import { checkInteractions, updateMedicine } from "../lib/api.js";

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [interactions, setInteractions] = useState([]);
  const [showInteractions, setShowInteractions] = useState(false);
  const [medicine, setMedicine] = useState(null);

  useEffect(() => {
    if (state?.medicine) {
      setMedicine(state.medicine);
      // Check interactions with existing medicines
      checkInteractions([state.medicine._id]).then(setInteractions);
    }
  }, [state]);

  const handleScheduleSave = async (id, schedule) => {
    const updated = await updateMedicine(id, { schedule });
    setMedicine(updated);
  };

  const handleReminderToggle = async (enabled) => {
    const times =
      medicine.schedule?.times?.length > 0
        ? [...medicine.schedule.times]
        : [...(medicine.dosageTimes || [])];
    const updated = await updateMedicine(medicine._id, {
      dailyDosageReminderEnabled: enabled,
      expiryReminderEnabled: enabled,
      schedule: {
        ...(medicine.schedule || {}),
        enabled,
        times: times.length > 0 ? times : [...(medicine.dosageTimes || [])],
        dosage:
          medicine.schedule?.dosage ||
          (medicine.dosagePerDay ? `${medicine.dosagePerDay}× daily` : ""),
      },
    });
    setMedicine(updated);
  };

  if (!medicine) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-black/60">No result. Add a medicine from the home page first.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          <FiArrowLeft /> Back to add medicine
        </button>
      </div>
    );
  }

  const status = getExpiryStatus(medicine.expiryDate);
  const hasInteractions = interactions.length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Medicine Details</h1>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-black/15 px-3 py-2 text-sm hover:bg-black/5"
        >
          <FiGrid /> Dashboard
        </Link>
      </div>

      {hasInteractions && (
        <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
          <button
            onClick={() => setShowInteractions(true)}
            className="flex items-center gap-2 text-purple-800 hover:text-purple-900"
          >
            <FiAlertTriangle />
            <span className="text-sm font-medium">
              {interactions.length} potential drug interaction{interactions.length > 1 ? "s" : ""} detected
            </span>
          </button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {medicine.imageUrl && (
          <img
            src={medicine.imageUrl}
            alt={medicine.name}
            className="h-64 w-full object-contain bg-black/5"
          />
        )}
        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-black/50">Medicine</p>
            <p className="mt-1 text-xl font-semibold">{medicine.name}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-black/50">Expiry</p>
              <p className="mt-1 text-lg">{formatDate(medicine.expiryDate)}</p>
            </div>
            <StatusBadge status={status} />
          </div>

          {medicine.dosagePerDay != null &&
            medicine.dosageTimes &&
            medicine.dosageTimes.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-black/50">Dosage</p>
              <p className="mt-1 text-sm">
                <span className="font-medium">{medicine.dosagePerDay}× per day</span>
                <span className="text-black/70">
                  {" "}
                  — {medicine.dosageTimes.join(", ")}
                </span>
              </p>
            </div>
          )}

          {(medicine.tabletsInPacket != null || medicine.syrupAmountMl != null) && (
            <div className="grid gap-3 rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm sm:grid-cols-2">
              {medicine.tabletsInPacket != null && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-black/50">Tablets in packet</p>
                  <p className="mt-1 font-medium">{medicine.tabletsInPacket}</p>
                </div>
              )}
              {medicine.syrupAmountMl != null && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-black/50">Syrup remaining</p>
                  <p className="mt-1 font-medium">{medicine.syrupAmountMl} ml</p>
                </div>
              )}
            </div>
          )}
          
          {medicine.dosageInstructions && (
            <div>
              <p className="text-xs uppercase tracking-wide text-black/50">Dosage Instructions</p>
              <p className="mt-1 text-sm">{medicine.dosageInstructions}</p>
            </div>
          )}
          
          <ScheduleManager
            medicine={medicine}
            onSave={handleScheduleSave}
            onReminderToggle={handleReminderToggle}
          />
          
          {state?.ocr?.rawText && (
            <details className="rounded-md border border-black/10 bg-black/[0.02] p-3 text-sm">
              <summary className="cursor-pointer font-medium">Raw OCR text</summary>
              <pre className="mt-2 whitespace-pre-wrap text-black/70">
                {state.ocr.rawText}
              </pre>
            </details>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-md border border-black/15 px-4 py-2 text-sm hover:bg-black/5"
        >
          <FiArrowLeft /> Add another
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90"
        >
          Submit
        </button>
      </div>
      
      {showInteractions && (
        <InteractionAlert
          interactions={interactions}
          onClose={() => setShowInteractions(false)}
        />
      )}
    </div>
  );
}