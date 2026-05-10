/* Custom service worker additions for push notifications.
   This file is injected into the generated SW by vite-plugin-pwa. */

self.addEventListener("push", (event) => {
  let data = { title: "SmartSwaasth", body: "You have a new notification" };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fallback to default
  }

  const options = {
    body: data.body || "You have a new notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "smartswaasth-notification",
    renotify: true,
    data: {
      url: data.url || "/dashboard",
    },
    actions: data.actions || [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "SmartSwaasth", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  if (event.action === "dismiss") return;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});
