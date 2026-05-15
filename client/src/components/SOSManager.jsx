import { useState, useEffect, useCallback, useRef } from "react";
import { FiAlertTriangle, FiX, FiPhoneCall } from "react-icons/fi";
import { sendSOS } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const SHAKE_THRESHOLD = 15; // Acceleration threshold for a shake
const SHAKE_WINDOW = 2000; // Time window in ms
const REQUIRED_SHAKES = 3; // Number of shakes required

export default function SOSManager() {
  const { user } = useAuth();
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [status, setStatus] = useState("idle"); // idle, counting, sending, success, error
  const [error, setError] = useState(null);
  
  const lastShakeTime = useRef(0);
  const shakeCount = useRef(0);
  const countdownInterval = useRef(null);

  const triggerSOS = useCallback(async () => {
    setStatus("sending");
    try {
      await sendSOS();
      setStatus("success");
      // Vibration feedback for success
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 500]);
      
      setTimeout(() => {
        setIsCountingDown(false);
        setStatus("idle");
        setCountdown(5);
      }, 5000);
    } catch (err) {
      console.error("SOS failed:", err);
      setStatus("error");
      setError(err.response?.data?.error || "Failed to send SOS alert.");
    }
  }, []);

  const handleCancel = () => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setIsCountingDown(false);
    setStatus("idle");
    setCountdown(5);
    shakeCount.current = 0;
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setStatus("counting");
    setCountdown(5);
    shakeCount.current = 0; // Reset shake count
    if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
  };

  useEffect(() => {
    let timer;
    if (status === "counting" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (status === "counting" && countdown === 0) {
      triggerSOS();
    }
    return () => clearInterval(timer);
  }, [status, countdown, triggerSOS]);

  useEffect(() => {
    if (!user || user.role !== "patient") return;

    const handleMotion = (event) => {
      if (isCountingDown) return;

      const { x, y, z } = event.accelerationIncludingGravity || {};
      if (x === null || y === null || z === null) return;

      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (totalAcceleration > SHAKE_THRESHOLD) {
        if (now - lastShakeTime.current > 200) { // Debounce individual shakes
          if (now - lastShakeTime.current < SHAKE_WINDOW) {
            shakeCount.current += 1;
          } else {
            shakeCount.current = 1;
          }

          lastShakeTime.current = now;

          if (shakeCount.current >= REQUIRED_SHAKES) {
            startCountdown();
          }
        }
      }
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const response = await DeviceMotionEvent.requestPermission();
          if (response === 'granted') {
            window.addEventListener("devicemotion", handleMotion);
          }
        } catch (e) {
          console.error("DeviceMotion permission denied", e);
        }
      } else {
        window.addEventListener("devicemotion", handleMotion);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [user, isCountingDown]);

  if (!isCountingDown) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="mx-4 w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 text-center text-white shadow-2xl backdrop-blur-xl">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
          <div className={`absolute inset-0 rounded-full bg-red-500/20 ${status === 'counting' ? 'animate-ping' : ''}`} />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/50">
            <FiAlertTriangle className="text-4xl" />
          </div>
        </div>

        {status === "counting" && (
          <>
            <h2 className="mb-2 text-3xl font-bold tracking-tight">Emergency SOS</h2>
            <p className="mb-8 text-white/70">
              Sending emergency alert in...
            </p>
            <div className="mb-10 text-8xl font-black tabular-nums">
              {countdown}
            </div>
            <button
              onClick={handleCancel}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-4 font-bold transition-all hover:bg-white/20 active:scale-95"
            >
              <FiX className="text-xl" /> CANCEL ALERT
            </button>
          </>
        )}

        {status === "sending" && (
          <>
            <h2 className="mb-2 text-3xl font-bold tracking-tight">Sending Alert...</h2>
            <p className="mb-10 text-white/70">Notifying your connected doctors.</p>
            <div className="flex justify-center py-10">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50">
              <FiPhoneCall className="text-2xl" />
            </div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-emerald-400">Alert Sent</h2>
            <p className="mb-8 text-white/70">
              Your doctors have been notified and will contact you shortly.
            </p>
            <button
              onClick={handleCancel}
              className="w-full rounded-2xl bg-white py-4 font-bold text-black transition-all hover:bg-white/90 active:scale-95"
            >
              DISMISS
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-red-400">Failed to Alert</h2>
            <p className="mb-8 text-white/70">{error}</p>
            <button
              onClick={handleCancel}
              className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white transition-all hover:bg-red-700 active:scale-95"
            >
              TRY AGAIN
            </button>
          </>
        )}
      </div>
    </div>
  );
}
