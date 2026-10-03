self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      console.error("Received an invalid admin push payload:", error);
    }
  }

  const notificationUrl =
    typeof payload.url === "string" && payload.url.startsWith("/admin/orders/")
      ? payload.url
      : "/admin/orders";

  event.waitUntil(
    self.registration.showNotification(payload.title || "New order received", {
      body: payload.body || "Tap to review the new order.",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: payload.tag || "new-order",
      data: { url: notificationUrl },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/admin/orders",
    self.location.origin
  );

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          client.navigate(target.href);
          return client.focus();
        }
      }
      return self.clients.openWindow(target.href);
    })
  );
});
