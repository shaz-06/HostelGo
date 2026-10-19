importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBArEahjyGqTWUObyXZPbHAtaGBXgsk5oY",
  authDomain: "buyto-43ce7.firebaseapp.com",
  projectId: "buyto-43ce7",
  messagingSenderId: "1039273029700",
  appId: "1:1039273029700:android:bc79a223275057864e0c11"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || "🛒 New Order Received";
  const notificationOptions = {
    body: payload.notification?.body || "Click to view order details",
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  if (orderId) {
    const targetUrl = `/admin/orders/${orderId}`;
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          let client = clientList[i];
          if (client.url.includes(self.location.origin)) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
        }
        return clients.openWindow(targetUrl);
      })
    );
  }
});
