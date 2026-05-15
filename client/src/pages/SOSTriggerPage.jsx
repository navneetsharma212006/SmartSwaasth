import { useEffect, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiLoader } from "react-icons/fi";
import { sendSOS } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function SOSTriggerPage() {
  const [status, setStatus] = useState("sending"); // sending, success, error
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const trigger = async () => {
      try {
        await sendSOS();
        setStatus("success");
        // Vibrate for success
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 500]);
        
        // Redirect to dashboard after a few seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } catch (err) {
        console.error("SOS trigger page error:", err);
        setStatus("error");
        setError(err.response?.data?.error || "Failed to trigger SOS. Are you logged in?");
      }
    };

    trigger();
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-600 p-8 text-white">
      <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-white text-red-600 shadow-2xl">
        {status === "sending" && <FiLoader className="h-16 w-16 animate-spin" />}
        {status === "success" && <FiCheckCircle className="h-16 w-16 text-emerald-500" />}
        {status === "error" && <FiAlertTriangle className="h-16 w-16 text-red-500" />}
      </div>

      <h1 className="mb-4 text-4xl font-black tracking-tight">
        {status === "sending" && "SENDING SOS..."}
        {status === "success" && "SOS ALERT SENT!"}
        {status === "error" && "ALERT FAILED"}
      </h1>

      <p className="max-w-md text-center text-xl text-white/80">
        {status === "sending" && "Notifying all your connected doctors immediately."}
        {status === "success" && "Your doctors have been notified. Taking you to dashboard..."}
        {status === "error" && error}
      </p>

      {status === "error" && (
        <button
          onClick={() => navigate("/login")}
          className="mt-8 rounded-2xl bg-white px-8 py-4 font-bold text-red-600 transition-transform active:scale-95"
        >
          LOG IN AGAIN
        </button>
      )}
    </div>
  );
}
