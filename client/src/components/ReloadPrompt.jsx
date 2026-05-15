import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Poll for updates every 60 seconds (catches Render/Vercel deploys)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  // Auto-apply the update after 3 seconds if user doesn't interact
  useEffect(() => {
    if (needRefresh) {
      const timer = setTimeout(() => {
        updateServiceWorker(true);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [needRefresh]);

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        background: "linear-gradient(135deg, #0e7490, #06b6d4)",
        color: "#fff",
        padding: "1rem 1.5rem",
        borderRadius: "1rem",
        boxShadow: "0 8px 32px rgba(6, 182, 212, 0.35)",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        fontFamily: "'Inter', sans-serif",
        fontSize: "0.9rem",
        backdropFilter: "blur(8px)",
        animation: "slideUp 0.4s ease-out",
      }}
    >
      <span>🔄 New version available!</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: "#fff",
          color: "#0e7490",
          border: "none",
          padding: "0.45rem 1rem",
          borderRadius: "0.5rem",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.85rem",
          transition: "transform 0.15s",
        }}
        onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
        onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
      >
        Update Now
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        style={{
          background: "transparent",
          color: "rgba(255,255,255,0.7)",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          padding: "0",
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
