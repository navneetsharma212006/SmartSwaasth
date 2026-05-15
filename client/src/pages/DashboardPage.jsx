import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiTrash2, FiEdit2, FiCheck, FiX, FiAlertTriangle, FiClipboard, FiShield, FiPlusCircle, FiActivity } from "react-icons/fi";
import StatusBadge from "../components/StatusBadge.jsx";
import ScheduleManager from "../components/ScheduleManager.jsx";
import MedicineInteractionModal from "../components/MedicineInteractionModal.jsx";
import PushNotificationToggle from "../components/PushNotificationToggle.jsx";
import { listMedicines, updateMedicine, checkInteractions } from "../lib/api.js";
import { formatDate, getExpiryStatus } from "../lib/expiry.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pickForInteraction = searchParams.get("pickForInteraction") === "1";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState([]);
  const [showInteractions, setShowInteractions] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listMedicines();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReminderToggle = async (id, enabled) => {
    const m = items.find((x) => x._id === id);
    if (!m) return;
    const times =
      m.schedule?.times?.length > 0
        ? [...m.schedule.times]
        : [...(m.dosageTimes || [])];
    await updateMedicine(id, {
      dailyDosageReminderEnabled: enabled,
      expiryReminderEnabled: enabled,
      schedule: {
        ...(m.schedule || {}),
        enabled,
        times: times.length > 0 ? times : [...(m.dosageTimes || [])],
        dosage:
          m.schedule?.dosage ||
          (m.dosagePerDay ? `${m.dosagePerDay}× daily` : ""),
      },
    });
    await load();
  };

  const expiringSoon = items.filter(
    (m) => getExpiryStatus(m.expiryDate).color === "yellow"
  );
  const expired = items.filter(
    (m) => getExpiryStatus(m.expiryDate).color === "red"
  );

  const hasInteractions = (interactions?.pairs?.length || 0) > 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your Medicines</h1>
          <p className="mt-2 text-black/60">
            Track expiry dates, manage schedules, and check interactions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/medicine-interaction"
            className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-100"
          >
            <FiPlusCircle /> Medicine interaction
          </Link>
          <button
            type="button"
            onClick={() => setShowInteractions(true)}
            className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-900 hover:bg-purple-100"
          >
            <FiShield /> Check Drug Interactions
          </button>
        </div>
      </div>

      {/* Push Notification Toggle */}
      <div className="mt-4 rounded-xl border border-black/10 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Push Notifications</h3>
            <p className="text-xs text-black/50">Get reminders on your device even when the app is closed</p>
          </div>
          <PushNotificationToggle />
        </div>
      </div>

      {pickForInteraction && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <strong>Pick a medicine</strong> — choose one row below to add it to the{" "}
            <strong>Medicine Interaction Checker</strong>. You will return to that page
            automatically.
          </p>
          <Link
            to="/medicine-interaction"
            className="shrink-0 text-sm font-medium text-blue-900 underline hover:no-underline"
          >
            Cancel
          </Link>
        </div>
      )}

      {(expired.length > 0 || expiringSoon.length > 0) && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <FiAlertTriangle className="mt-0.5 text-lg" />
          <div>
            {expired.length > 0 && (
              <p>
                <strong>{expired.length}</strong> medicine
                {expired.length > 1 ? "s have" : " has"} expired.
              </p>
            )}
            {expiringSoon.length > 0 && (
              <p>
                <strong>{expiringSoon.length}</strong> medicine
                {expiringSoon.length > 1 ? "s are" : " is"} expiring within 30 days.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        {loading ? (
          <div className="p-8 text-center text-black/60">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-black/60">
            No medicines yet. Scan a label or enter details to get started.
          </div>
        ) : (
          <div className="divide-y divide-black/10">
            {items.map((m) => {
              const status = getExpiryStatus(m.expiryDate);
              const medicineInteractions = (interactions?.pairs || []).filter(
                i => i.drugA === m.name || i.drugB === m.name
              );
              
              return (
                <div key={m._id} className="p-4 hover:bg-black/[0.02]">
                  <div className="flex items-start gap-4">
                    {m.imageUrl ? (
                      <img
                        src={m.imageUrl}
                        alt={m.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-black/5" />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{m.name}</h3>
                          
                          <div className="mt-1 flex flex-wrap gap-3 text-sm">
                            <span className="text-black/60">
                              Expires: {formatDate(m.expiryDate)}
                            </span>
                            {m.tabletsInPacket != null && (
                              <span className="text-black/60">
                                Tablets: {m.tabletsInPacket}
                              </span>
                            )}
                            {m.syrupAmountMl != null && (
                              <span className="text-black/60">
                                Syrup: {m.syrupAmountMl} ml
                              </span>
                            )}
                            <StatusBadge status={status} />
                            {medicineInteractions.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-purple-600">
                                <FiShield className="text-xs" />
                                {medicineInteractions.length} interaction
                                {medicineInteractions.length > 1 ? "s" : ""}
                              </span>
                            )}
                            {m.complianceRisk && (
                              <span className={`inline-flex items-center gap-1 font-medium ${
                                m.complianceRisk === 'high' ? 'text-red-600' : 
                                m.complianceRisk === 'moderate' ? 'text-amber-600' : 
                                'text-emerald-600'
                              }`}>
                                <FiActivity className="text-xs" />
                                {m.complianceScore}% Adherence ({m.complianceRisk} risk)
                              </span>
                            )}
                          </div>
                          
                          {m.dosageInstructions && (
                            <p className="mt-2 text-sm text-black/60">
                              <strong>Instructions:</strong> {m.dosageInstructions}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1">
                          <Link
                            to={`/daily-checklist/${m._id}`}
                            className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-xs font-medium text-black/80 hover:bg-black/5 sm:text-sm"
                            title="Daily checklist"
                          >
                            <FiClipboard /> Checklist
                          </Link>
                          {pickForInteraction && (
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
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <ScheduleManager
                          medicine={m}
                          readOnly={true}
                          onReminderToggle={(enabled) =>
                            handleReminderToggle(m._id, enabled)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {showInteractions && (
        <MedicineInteractionModal
          isOpen={showInteractions}
          onClose={() => setShowInteractions(false)}
          medicineIds={items.map(m => m._id)}
        />
      )}
    </div>
  );
}