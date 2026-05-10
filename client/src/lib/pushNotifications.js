/**
 * Push notification helpers for the client.
 * Handles permission request, subscription, and sending subscription to backend.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  "BEi1E3hpsWAqLQr9VvxPc7bFYw0r4FtHXYFu68PkKQ7IQputELv-yGOlT00rAtq7LaIkTPpBMpJiAjSwWVZv2JM";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported and permission is granted
 */
export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Get current notification permission state
 */
export function getPermissionState() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission; // "default", "granted", "denied"
}

/**
 * Request notification permission, subscribe, and send subscription to server
 * @param {string} token - JWT auth token
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function subscribeToPush(token) {
  if (!isPushSupported()) {
    return { success: false, message: "Push notifications not supported" };
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, message: "Notification permission denied" };
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to server
    const response = await fetch(`${API_URL}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription on server");
    }

    return { success: true, message: "Push notifications enabled!" };
  } catch (err) {
    console.error("Push subscription error:", err);
    return { success: false, message: err.message };
  }
}

/**
 * Unsubscribe from push notifications
 * @param {string} token - JWT auth token
 */
export async function unsubscribeFromPush(token) {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      // Tell the server to remove the subscription
      await fetch(`${API_URL}/push/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }
  } catch (err) {
    console.error("Unsubscribe error:", err);
  }
}
