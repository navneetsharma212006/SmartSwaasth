import { useState, useEffect } from "react";
import { FiBell, FiBellOff } from "react-icons/fi";
import {
  isPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
} from "../lib/pushNotifications.js";

/**
 * A button component that allows users to enable/disable browser push notifications.
 * Shows appropriate states for: unsupported, denied, default (can enable), and granted.
 */
export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(getPermissionState());
  }, []);

  if (!supported) return null;

  const token = localStorage.getItem("smart_swaasth_token");

  const handleEnable = async () => {
    if (!token) {
      setFeedback("Please log in first");
      return;
    }
    setLoading(true);
    setFeedback("");
    const result = await subscribeToPush(token);
    setPermission(getPermissionState());
    setFeedback(result.message);
    setLoading(false);
    setTimeout(() => setFeedback(""), 4000);
  };

  const handleDisable = async () => {
    if (!token) return;
    setLoading(true);
    await unsubscribeFromPush(token);
    setFeedback("Push notifications disabled");
    setLoading(false);
    setTimeout(() => setFeedback(""), 4000);
  };

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {isDenied ? (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <FiBellOff />
          <span>Notifications blocked in browser settings</span>
        </div>
      ) : isGranted ? (
        <>
          <button
            onClick={handleDisable}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/70 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
          >
            <FiBellOff className="text-base" />
            {loading ? "Disabling..." : "Disable Push Notifications"}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </>
      ) : (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg transition-all disabled:opacity-50"
        >
          <FiBell className="text-base" />
          {loading ? "Enabling..." : "🔔 Enable Push Notifications"}
        </button>
      )}
      {feedback && (
        <span className="text-xs text-black/60 animate-pulse">{feedback}</span>
      )}
    </div>
  );
}
