self.addEventListener('push', function(event) {
  if (Notification.permission !== 'granted') {
    return;
  }

  event.waitUntil((async () => {
    const data = event.data?.json() || {};

    const title = data.title || 'New Notification';
    const options = {
      body: data.body || '',
      icon: '/assets/img/gina.png',
      badge: '/assets/img/gina.png',
      data: {
        url: data.url || '/map.html',
        notification_id: data.notification_id || null,
      }
    };

    try {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      const isClientFocused = allClients.some(
        client => client.focused || client.visibilityState === 'visible'
      );

      if (!isClientFocused) {
        await self.registration.showNotification(title, options);
      } else {
        console.log("👁️ App is visible. Skipping notification.");
      }
    } catch (err) {
      console.error("Error handling push:", err);
    }
  })());
});


//Handle notification click to open tab
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/map.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
