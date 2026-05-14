import { useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────
   Alarm sound generated entirely via Web Audio API.
   No external files needed — works offline.
───────────────────────────────────────────────────────────── */
function createAlarmBuzzer() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playTone = (freq, start, dur, vol = 0.4) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    };

    // Alarm pattern: high-low-high  ×3
    let t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      playTone(1047, t, 0.18); t += 0.22;
      playTone(784,  t, 0.12); t += 0.16;
      playTone(1047, t, 0.18); t += 0.22;
      t += 0.15;
    }
    return ctx;
  } catch (_) {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   Vibration pattern (repeating until cancelled)
───────────────────────────────────────────────────────────── */
let vibInterval = null;
function startVibration() {
  if (!navigator.vibrate) return;
  navigator.vibrate([600, 250, 600, 250, 600]);
  vibInterval = setInterval(() => {
    navigator.vibrate([600, 250, 600, 250, 600]);
  }, 2500);
}
function stopVibration() {
  if (vibInterval) { clearInterval(vibInterval); vibInterval = null; }
  if (navigator.vibrate) navigator.vibrate(0);
}

/* ─────────────────────────────────────────────────────────────
   AlarmModal
   Props:
     medicine  – { name, dosageInstructions, dosagePerDay }
     timeStr   – "08:30"
     onDismiss – () => void
     onSnooze  – (minutes: number) => void
───────────────────────────────────────────────────────────── */
export default function AlarmModal({ medicine, timeStr, onDismiss, onSnooze }) {
  const [clock, setClock] = useState("");
  const [snoozeCountdown, setSnoozeCountdown] = useState(null); // seconds left
  const audioCtxRef = useRef(null);
  const soundTimerRef = useRef(null);
  const snoozeTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  /* ── Live clock ──────────────────────────────────────────── */
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Audio + Vibration loop ──────────────────────────────── */
  useEffect(() => {
    const playLoop = () => {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
      }
      audioCtxRef.current = createAlarmBuzzer();
      soundTimerRef.current = setTimeout(playLoop, 3000);
    };
    playLoop();
    startVibration();

    return () => {
      clearTimeout(soundTimerRef.current);
      stopVibration();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
      }
    };
  }, []);

  const stopAll = () => {
    clearTimeout(soundTimerRef.current);
    clearTimeout(snoozeTimerRef.current);
    clearInterval(countdownTimerRef.current);
    stopVibration();
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (_) {}
    }
  };

  const handleDismiss = () => {
    stopAll();
    onDismiss();
  };

  const handleSnooze = () => {
    stopAll();
    const SNOOZE_MIN = 5;
    setSnoozeCountdown(SNOOZE_MIN * 60);
    // Countdown display
    countdownTimerRef.current = setInterval(() => {
      setSnoozeCountdown((s) => {
        if (s <= 1) {
          clearInterval(countdownTimerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    // Re-trigger alarm after snooze
    snoozeTimerRef.current = setTimeout(() => {
      setSnoozeCountdown(null);
      // Restart audio + vibration
      const playLoop = () => {
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch (_) {}
        }
        audioCtxRef.current = createAlarmBuzzer();
        soundTimerRef.current = setTimeout(playLoop, 3000);
      };
      playLoop();
      startVibration();
    }, SNOOZE_MIN * 60 * 1000);
  };

  /* ── Snooze waiting screen ─────────────────────────────── */
  if (snoozeCountdown !== null) {
    const mins = Math.floor(snoozeCountdown / 60).toString().padStart(2, "0");
    const secs = (snoozeCountdown % 60).toString().padStart(2, "0");
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="text-7xl mb-6">⏰</div>
        <p className="text-blue-300 text-sm font-semibold tracking-widest uppercase mb-2">
          Snoozed — reminder in
        </p>
        <p className="text-6xl font-bold tabular-nums tracking-tight">
          {mins}:{secs}
        </p>
        <p className="text-white/50 mt-4 text-base">{medicine?.name}</p>
        <button
          onClick={handleDismiss}
          className="mt-10 px-8 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition"
        >
          Cancel Snooze
        </button>
      </div>
    );
  }

  /* ── Full-screen alarm ──────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-gradient-to-b from-[#0a0e27] via-[#0d1b4b] to-[#0a0e27] text-white overflow-hidden select-none">

      {/* Animated pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {[80, 120, 160, 200, 250].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-blue-500/20"
            style={{
              width: size * 2,
              height: size * 2,
              animation: `ping ${1.5 + i * 0.4}s cubic-bezier(0,0,0.2,1) infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite alternate`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* ── Top section: time ── */}
      <div className="relative z-10 flex flex-col items-center pt-14 gap-1">
        <span className="text-xs font-bold tracking-[0.3em] text-blue-300 uppercase">
          💊 Medicine Alarm
        </span>
        <span className="text-5xl font-black tabular-nums tracking-tight mt-2">
          {clock}
        </span>
        {timeStr && (
          <span className="text-blue-400/70 text-sm mt-1">
            Scheduled: {timeStr}
          </span>
        )}
      </div>

      {/* ── Middle: animated pill icon + name ── */}
      <div className="relative z-10 flex flex-col items-center gap-5">
        {/* Glowing pill */}
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
          style={{
            background: "radial-gradient(circle at 35% 35%, #6366f1, #4f46e5, #1d4ed8)",
            boxShadow: "0 0 60px 20px rgba(99,102,241,0.4), 0 0 120px 40px rgba(99,102,241,0.15)",
            animation: "pulse 1s ease-in-out infinite",
          }}
        >
          <span className="text-6xl" style={{ filter: "drop-shadow(0 0 12px white)" }}>
            💊
          </span>
        </div>

        <div className="text-center px-6">
          <h1
            className="text-4xl font-extrabold mb-2 leading-tight"
            style={{ textShadow: "0 0 30px rgba(147,197,253,0.6)" }}
          >
            {medicine?.name || "Medicine"}
          </h1>
          <p className="text-blue-200 text-base">
            {medicine?.dosagePerDay
              ? `${medicine.dosagePerDay}× per day`
              : "Time to take your dose"}
          </p>
          {medicine?.dosageInstructions && (
            <p className="text-white/50 text-sm mt-2 max-w-[260px] mx-auto leading-snug">
              {medicine.dosageInstructions}
            </p>
          )}
        </div>
      </div>

      {/* ── Bottom: Dismiss + Snooze ── */}
      <div className="relative z-10 w-full px-8 pb-14 flex flex-col items-center gap-3">
        {/* Take Medicine — primary CTA */}
        <button
          onClick={handleDismiss}
          className="w-full max-w-sm py-5 rounded-3xl font-bold text-xl text-slate-900 active:scale-95 transition-transform"
          style={{
            background: "linear-gradient(135deg, #f0fdf4, #bbf7d0, #86efac)",
            boxShadow: "0 8px 32px rgba(134,239,172,0.5)",
          }}
        >
          ✅ &nbsp; Medicine Taken
        </button>

        {/* Snooze — secondary */}
        <button
          onClick={handleSnooze}
          className="w-full max-w-sm py-4 rounded-3xl font-semibold text-base text-white active:scale-95 transition-transform"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          ⏰ &nbsp; Snooze 5 Minutes
        </button>
      </div>

      {/* CSS keyframes injected inline */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes float {
          from { transform: translateY(0px) scale(1); opacity: 0.4; }
          to   { transform: translateY(-20px) scale(1.3); opacity: 0.8; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
