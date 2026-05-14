/* ============================================================
   sw-push.js — Custom push + notification-click handlers
   Imported into the vite-pwa generated service worker via
   workbox.importScripts in vite.config.js
   ============================================================ */

/* ---------- Push: show the notification ---------- */
self.addEventListener("push", (event) => {
  let data = { title: "SmartSwaasth", body: "You have a new notification" };

  try {
    if (event.data) data = event.data.json();
  } catch (_) { /* fallback */ }

  const isDosage = data.type === "dosage";

  const options = {
    body: data.body || "You have a new notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: isDosage
      ? [500, 200, 500, 200, 500, 200, 1000]
      : [200, 100, 200],
    tag: data.tag || "smartswaasth-notification",
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: data.url || "/",
      type: data.type,
      medicineName: data.medicineName,
      dosageTime: data.dosageTime,
      tag: data.tag,
      body: data.body,
      title: data.title,
    },
    actions: isDosage
      ? [
          { action: "take",   title: "✅ Taken"         },
          { action: "snooze", title: "⏰ Snooze 5 min"  },
        ]
      : [
          { action: "open",    title: "Open App" },
          { action: "dismiss", title: "Dismiss"  },
        ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "SmartSwaasth", options).then(() => {
      // If it's a dosage reminder, message all open app windows so they
      // can immediately play the alarm sound (SW cannot play audio itself)
      if (isDosage) {
        return self.clients
          .matchAll({ includeUncontrolled: true, type: "window" })
          .then((clientList) => {
            clientList.forEach((client) => {
              client.postMessage({
                type: "DOSAGE_ALARM",
                medicineName: data.medicineName,
                dosageTime: data.dosageTime,
              });
            });
          });
      }
    })
  );
});

/* ---------- Notification click ---------- */
self.addEventListener("notificationclick", (event) => {
  const notif = event.notification;
  notif.close();

  const { url, type, medicineName, dosageTime, tag, body, title } =
    notif.data || {};

  // ── Snooze: re-show notification after 5 minutes ──────────────────────────
  if (event.action === "snooze") {
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration
            .showNotification(title || "Medicine Reminder", {
              body: body || `Time to take ${medicineName}`,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              vibrate: [500, 200, 500, 200, 500, 200, 1000],
              tag: tag || "snooze-reminder",
              renotify: true,
              requireInteraction: true,
              silent: false,
              data: { url, type, medicineName, dosageTime, tag, body, title },
              actions: [
                { action: "take",   title: "✅ Taken"        },
                { action: "snooze", title: "⏰ Snooze 5 min" },
              ],
            })
            .then(resolve)
            .catch(resolve);
        }, 5 * 60 * 1000); // 5 minutes
      })
    );
    return;
  }

  // ── Dismiss / Take: just close (already done above) ───────────────────────
  if (event.action === "dismiss" || event.action === "take") return;

  // ── Default tap: open / focus the app ────────────────────────────────────
  const targetUrl = url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (
            client.url.includes(self.location.origin) &&
            "focus" in client
          ) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});
