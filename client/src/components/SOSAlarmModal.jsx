import { useEffect, useRef } from "react";
import { FiAlertTriangle, FiPhone, FiMessageSquare, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function SOSAlarmModal({ sosAlert, onDismiss }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    // Play a loud emergency sound
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    // Vibration pattern for emergency: long pulses
    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000, 500, 1000]);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (navigator.vibrate) navigator.vibrate(0);
    };
  }, []);

  const handleGoToChat = () => {
    onDismiss();
    navigate(`/chat/${sosAlert.patient.id}`);
  };

  const handleGoToDashboard = () => {
    onDismiss();
    navigate(`/patient-plan/${sosAlert.patient.id}`);
  };

  if (!sosAlert) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-red-600 p-4 sm:p-6 animate-in fade-in duration-300">
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3" // Emergency siren/beep
        loop
      />
      
      <div className="w-full max-w-lg rounded-[2.5rem] bg-white p-8 text-center shadow-2xl shadow-black/40 sm:p-12">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-red-600/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-red-600 shadow-xl shadow-red-600/50">
            <FiAlertTriangle className="text-5xl text-white" />
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-black tracking-tight text-red-600">
          PATIENT EMERGENCY
        </h1>
        <p className="mb-8 text-xl font-medium text-black/60">
          SOS Alert triggered by patient
        </p>

        <div className="mb-10 rounded-3xl bg-red-50 p-6 text-left border border-red-100">
          <div className="mb-1 text-sm font-bold uppercase tracking-wider text-red-400">Patient Details</div>
          <div className="text-2xl font-bold text-red-900">{sosAlert.patient.name}</div>
          <div className="text-red-700/70">{sosAlert.patient.email}</div>
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600/60">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Triggered at {new Date(sosAlert.timestamp).toLocaleTimeString()}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={handleGoToChat}
            className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-black text-lg font-bold text-white transition-all hover:bg-black/90 active:scale-95"
          >
            <FiMessageSquare className="text-xl" /> OPEN CHAT
          </button>
          <button
            onClick={handleGoToDashboard}
            className="flex h-16 items-center justify-center gap-3 rounded-2xl border-2 border-black text-lg font-bold text-black transition-all hover:bg-black/5 active:scale-95"
          >
            <FiPhone className="text-xl" /> VIEW PLAN
          </button>
        </div>

        <button
          onClick={onDismiss}
          className="mt-8 flex w-full items-center justify-center gap-2 text-sm font-bold text-black/40 transition-colors hover:text-red-600"
        >
          <FiX /> DISMISS EMERGENCY ALERT
        </button>
      </div>

      <style>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `}</style>
    </div>
  );
}
