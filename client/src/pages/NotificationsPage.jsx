import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck, FiTrash2 } from "react-icons/fi";
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications(50); // fetch up to 50
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClickNotification = async (n) => {
    if (!n.read) {
      try {
        const updated = await markNotificationRead(n._id);
        setNotifications((prev) =>
          prev.map((x) => (x._id === n._id ? { ...x, ...updated, read: true } : x))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }
    // Navigate based on type if needed, or just go to dashboard
    navigate("/dashboard");
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-black/50">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FiBell className="text-emerald-600" /> Notifications
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
              {unreadCount} new
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition bg-emerald-50 px-3 py-1.5 rounded-lg"
          >
            <FiCheck /> Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-16 px-4 border border-black/5 rounded-2xl bg-black/[0.02]">
          <FiBell className="mx-auto text-4xl text-black/20 mb-4" />
          <h3 className="text-lg font-medium text-black/70">No notifications yet</h3>
          <p className="text-black/50 mt-1">Your daily dose reminders and expiry alerts will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => handleClickNotification(n)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  n.read 
                    ? "border-black/5 bg-white text-black/70 hover:border-black/15" 
                    : "border-emerald-100 bg-emerald-50/50 text-black shadow-sm hover:bg-emerald-50"
                }`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 shrink-0">
                    {n.type === "expiry" ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <FiBell className="text-sm" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <FiCheck className="text-sm" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <p className={`font-medium ${n.read ? "text-black/80" : "text-black"}`}>
                        {n.title}
                      </p>
                      <span className="shrink-0 text-xs text-black/40 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleDateString()}{" "}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${n.read ? "text-black/60" : "text-black/75"}`}>
                      {n.message}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
