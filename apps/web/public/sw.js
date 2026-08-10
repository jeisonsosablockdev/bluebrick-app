self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function parsePushPayload(data) {
  if (!data) {
    return {
      title: "BRIDS",
      body: "",
      url: "/"
    };
  }

  try {
    const parsed = data.json();
    return {
      title: typeof parsed?.title === "string" && parsed.title.trim() ? parsed.title.trim() : "BRIDS",
      body: typeof parsed?.body === "string" ? parsed.body : "",
      url: typeof parsed?.url === "string" && parsed.url.trim() ? parsed.url.trim() : "/"
    };
  } catch (_error) {
    const text = data.text ? data.text() : "";
    return {
      title: "BRIDS",
      body: typeof text === "string" ? text : "",
      url: "/"
    };
  }
}

self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event.data);

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: {
        url: payload.url
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destinationUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(destinationUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(destinationUrl);
      }

      return undefined;
    })
  );
});
