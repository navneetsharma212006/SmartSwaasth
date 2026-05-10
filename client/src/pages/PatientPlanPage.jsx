import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FiTrash2, 
  FiEdit2, 
  FiCheck, 
  FiX, 
  FiPlus, 
  FiArrowLeft,
  FiClock,
  FiCalendar,
  FiActivity
} from "react-icons/fi";
import { 
  listPatientMedicines, 
  createPatientManualMedicine, 
  updatePatientMedicine, 
  deletePatientMedicine 
} from "../lib/api";
import { formatDate } from "../lib/expiry";
import ScheduleManager from "../components/ScheduleManager";

export default function PatientPlanPage() {
  const { patientId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    expiryDate: "",
    dosagePerDay: 1,
    dosageTimes: ["08:00"],
    tabletsInPacket: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await listPatientMedicines(patientId);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await createPatientManualMedicine(patientId, newMed);
      setShowAddForm(false);
      setNewMed({ name: "", expiryDate: "", dosagePerDay: 1, dosageTimes: ["08:00"], tabletsInPacket: "" });
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add medicine");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this medication plan?")) {
      await deletePatientMedicine(patientId, id);
      load();
    }
  };

  const handleScheduleSave = async (id, schedule) => {
    await updatePatientMedicine(patientId, id, { schedule });
    load();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/patients" className="inline-flex items-center gap-2 text-sm text-black/50 hover:text-black mb-6 transition-colors">
        <FiArrowLeft /> Back to Patients
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Medication Plan</h1>
          <p className="text-black/60 mt-1">Plan and manage medicines for your patient.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-all"
        >
          {showAddForm ? <FiX /> : <FiPlus />} {showAddForm ? "Cancel" : "Add Medicine"}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-lg mb-8 animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold mb-4">New Medication Details</h2>
          <form onSubmit={handleAddMedicine} className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Medicine Name</label>
                <input
                  required
                  type="text"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-black/5"
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Expiry Date</label>
                <input
                  required
                  type="date"
                  value={newMed.expiryDate}
                  onChange={(e) => setNewMed({ ...newMed, expiryDate: e.target.value })}
                  className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-black/5"
                />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Doses per Day</label>
                <select
                  value={newMed.dosagePerDay}
                  onChange={(e) => {
                    const count = parseInt(e.target.value);
                    const times = Array(count).fill("08:00");
                    setNewMed({ ...newMed, dosagePerDay: count, dosageTimes: times });
                  }}
                  className="w-full bg-black/5 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 ring-black/5"
                >
                  <option value={1}>1 time daily</option>
                  <option value={2}>2 times daily</option>
                  <option value={3}>3 times daily</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-black/40 uppercase tracking-wider mb-1">Dose Times</label>
                <div className="flex gap-2">
                  {newMed.dosageTimes.map((time, i) => (
                    <input
                      key={i}
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const times = [...newMed.dosageTimes];
                        times[i] = e.target.value;
                        setNewMed({ ...newMed, dosageTimes: times });
                      }}
                      className="bg-black/5 border-none rounded-lg px-2 py-2 text-xs focus:ring-1 ring-black/10"
                    />
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" className="mt-2 w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-black/90">
              Save to Patient's Plan
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="p-12 text-center text-black/40 italic">Loading patient plan...</div>
        ) : items.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-black/20 text-center">
            <FiActivity className="text-4xl text-black/10 mx-auto mb-4" />
            <p className="text-black/50">No medicines planned yet for this patient.</p>
          </div>
        ) : (
          items.map((m) => (
            <div key={m._id} className="bg-white p-6 rounded-2xl border border-black/10 hover:border-black/20 transition-all group shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-black/5 rounded-xl flex items-center justify-center">
                    <FiActivity className="text-2xl text-black/20 group-hover:text-black/40 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{m.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-black/40">
                      <span className="flex items-center gap-1"><FiCalendar /> Exp: {formatDate(m.expiryDate)}</span>
                      <span className="flex items-center gap-1"><FiClock /> {m.dosagePerDay}× Daily</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(m._id)}
                  className="p-2 text-black/20 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <FiTrash2 />
                </button>
              </div>

              <div className="pt-4 border-t border-black/5">
                <ScheduleManager
                  medicine={m}
                  onSave={handleScheduleSave}
                  onReminderToggle={async (enabled) => {
                    await updatePatientMedicine(patientId, m._id, {
                      dailyDosageReminderEnabled: enabled,
                      expiryReminderEnabled: enabled,
                    });
                    load();
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
