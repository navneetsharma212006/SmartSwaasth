import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FiUsers, 
  FiPlus, 
  FiKey, 
  FiUserPlus, 
  FiExternalLink, 
  FiClipboard,
  FiCheckCircle,
  FiAlertCircle
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { 
  generateConnectionOTP, 
  listConnectedPatients, 
  joinDoctor 
} from "../lib/api";

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [joinOtp, setJoinOtp] = useState(["", "", "", ""]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const isCaregiver = user?.role === "caregiver";

  useEffect(() => {
    if (isCaregiver) {
      loadPatients();
    }
  }, [isCaregiver]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const data = await listConnectedPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOTP = async () => {
    setLoading(true);
    try {
      const data = await generateConnectionOTP();
      setGeneratedOtp(data.otp);
      setMessage({ type: "success", text: "Code generated! Valid for 10 minutes." });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate code." });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newJoinOtp = [...joinOtp];
    newJoinOtp[index] = value.slice(-1);
    setJoinOtp(newJoinOtp);

    // Auto-focus next
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleJoinDoctor = async (e) => {
    e.preventDefault();
    const otpValue = joinOtp.join("");
    if (otpValue.length < 4) {
      setMessage({ type: "error", text: "Please enter the full 4-digit code." });
      return;
    }

    setLoading(true);
    try {
      const res = await joinDoctor(otpValue);
      setMessage({ type: "success", text: res.message });
      setJoinOtp(["", "", "", ""]);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to connect." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FiUsers className="text-black/80" />
          {isCaregiver ? "Your Patients" : "Connect with Doctor"}
        </h1>
        <p className="text-black/60 mt-2">
          {isCaregiver 
            ? "Manage medication plans and monitor adherence for your connected patients."
            : "Connect with your doctor or caregiver to receive a managed medication plan."}
        </p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-100" : "bg-red-50 text-red-900 border border-red-100"
        }`}>
          {message.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {isCaregiver ? (
        <div className="grid gap-6">
          {/* OTP Generation Section */}
          <div className="bg-white p-6 rounded-2xl border border-black/10 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FiUserPlus /> Add New Patient
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleGenerateOTP}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-black/90 transition-all flex items-center justify-center gap-2"
              >
                <FiKey /> Generate Connection Code
              </button>
              
              {generatedOtp && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {generatedOtp.split("").map((digit, i) => (
                      <span key={i} className="w-12 h-14 bg-black/5 rounded-xl flex items-center justify-center text-2xl font-bold text-black border border-black/10">
                        {digit}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-black/40 font-medium uppercase tracking-wider">Valid for 10m</span>
                </div>
              )}
            </div>
            <p className="mt-4 text-sm text-black/50">
              Share this 4-digit code with your patient. They need to enter it on their "Patients" page.
            </p>
          </div>

          {/* Patients List */}
          <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-black/5 bg-black/[0.01]">
              <h2 className="font-semibold">Connected Patients ({patients.length})</h2>
            </div>
            {loading && patients.length === 0 ? (
              <div className="p-12 text-center text-black/40">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="p-12 text-center text-black/40">
                No patients connected yet. Generate a code to get started.
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {patients.map((patient) => (
                  <div key={patient._id} className="p-6 flex items-center justify-between hover:bg-black/[0.01] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center text-xl font-bold text-black/60">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-black">{patient.name}</h3>
                        <p className="text-sm text-black/50">{patient.email}</p>
                      </div>
                    </div>
                    <Link
                      to={`/patient-plan/${patient._id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-black/10 rounded-lg text-sm font-medium text-black hover:bg-black/5 transition-colors"
                    >
                      <FiClipboard className="text-black/60" />
                      Manage Plan
                      <FiExternalLink className="text-[10px]" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Patient View: Connect with Doctor */
        <div className="bg-white p-8 rounded-3xl border border-black/10 shadow-lg text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl shadow-black/10">
            <FiKey />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect to Doctor</h2>
          <p className="text-black/50 mb-8 px-4">
            Enter the 4-digit connection code provided by your doctor or caregiver.
          </p>

          <form onSubmit={handleJoinDoctor}>
            <div className="flex justify-center gap-3 mb-8">
              {joinOtp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleJoinOTPChange(i, e.target.value)}
                  className="w-14 h-16 bg-black/5 border-2 border-transparent focus:border-black focus:bg-white text-center text-3xl font-bold rounded-2xl outline-none transition-all"
                  required
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-2xl font-semibold text-lg hover:bg-black/90 active:scale-95 transition-all shadow-lg shadow-black/20"
            >
              {loading ? "Connecting..." : "Connect with Doctor"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-black/5">
            <p className="text-xs text-black/40 leading-relaxed italic">
              "Connecting with a doctor allows them to remotely manage your medication schedules and help ensure your safety."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
