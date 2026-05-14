import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiActivity, FiCalendar, FiClock, FiClipboard } from "react-icons/fi";
import { getDoctorPrescribedMedicines, checkInteractions, updateMedicine } from "../lib/api";
import { formatDate, getExpiryStatus } from "../lib/expiry";
import ScheduleManager from "../components/ScheduleManager";
import InteractionAlert from "../components/InteractionAlert";
import StatusBadge from "../components/StatusBadge";

export default function DoctorMedicinesPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState([]);
  const [showInteractions, setShowInteractions] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDoctorPrescribedMedicines(doctorId);
      setItems(data);
      if (data.length > 0) {
        const interactionResults = await checkInteractions(data.map(m => m._id));
        setInteractions(interactionResults);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [doctorId]);

  const handleReminderToggle = async (id, enabled) => {
    await updateMedicine(id, { 
      dailyDosageReminderEnabled: enabled,
      expiryReminderEnabled: enabled
    });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black mb-6 transition-colors">
        <FiArrowLeft /> Back to Care Team
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Medicines</h1>
          <p className="text-black/60 mt-1">Medicines prescribed by this doctor.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {interactions?.pairs?.length > 0 && (
            <button
              type="button"
              onClick={() => setShowInteractions(true)}
              className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
            >
              <FiActivity /> {interactions.length} Interaction{interactions.length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {(() => {
        const expiringSoon = items.filter((m) => getExpiryStatus(m.expiryDate).color === "yellow");
        const expired = items.filter((m) => getExpiryStatus(m.expiryDate).color === "red");
        if (expired.length > 0 || expiringSoon.length > 0) {
          return (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              <FiActivity className="mt-0.5 text-lg" />
              <div>
                {expired.length > 0 && (
                  <p>
                    <strong>{expired.length}</strong> medicine{expired.length > 1 ? "s have" : " has"} expired.
                  </p>
                )}
                {expiringSoon.length > 0 && (
                  <p>
                    <strong>{expiringSoon.length}</strong> medicine{expiringSoon.length > 1 ? "s are" : " is"} expiring within 30 days.
                  </p>
                )}
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="grid gap-4">
        {loading ? (
          <div className="p-12 text-center text-black/40 italic">Loading medicines...</div>
        ) : items.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-black/20 text-center">
            <FiActivity className="text-4xl text-black/10 mx-auto mb-4" />
            <p className="text-black/50">No medicines prescribed by this doctor yet.</p>
          </div>
        ) : (
          items.map((m) => {
            const status = getExpiryStatus(m.expiryDate);
            const medicineInteractions = (interactions?.pairs || []).filter(
              i => i.drugA === m.name || i.drugB === m.name
            );

            return (
              <div key={m._id} className="bg-white p-6 rounded-2xl border border-black/10 hover:border-black/20 transition-all group shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-4 w-full">
                    <div className="w-14 h-14 bg-black/5 rounded-xl flex items-center justify-center shrink-0">
                      <FiActivity className="text-2xl text-black/20 group-hover:text-black/40 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{m.name}</h3>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-black/40">
                        <span className="flex items-center gap-1"><FiCalendar /> Exp: {formatDate(m.expiryDate)}</span>
                        <span className="flex items-center gap-1"><FiClock /> {m.dosagePerDay}× Daily</span>
                        <StatusBadge status={status} />
                        {medicineInteractions.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-purple-600 font-medium">
                            <FiActivity className="text-xs" />
                            {medicineInteractions.length} interaction{medicineInteractions.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {m.dosageInstructions && (
                        <p className="mt-2 text-sm text-black/60">
                          <strong>Instructions:</strong> {m.dosageInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 ml-2 items-end">
                    <Link
                      to={`/daily-checklist/${m._id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-xs font-medium text-black/70 hover:bg-black/5 sm:text-sm"
                    >
                      <FiClipboard /> Checklist
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/medicine-interaction", {
                          state: {
                            pickup: { id: m._id, name: m.name },
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 sm:text-sm"
                    >
                      Check Interaction
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5">
                  <ScheduleManager
                    medicine={m}
                    readOnly={true}
                    onReminderToggle={(enabled) => handleReminderToggle(m._id, enabled)}
                  />
                </div>
              </div>
            );
          })
        )}
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
