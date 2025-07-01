async function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(trimmed.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function serializeSubscription(subscription) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
      auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
    }
  };
}

//Automatically triggered on page load
window.addEventListener('load', async () => {

  if (!authToken) {
    console.warn('Cannot subscribe: authToken is missing.');
    return;
  }

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      //Register the Service Worker
      // const registration = await navigator.serviceWorker.register('/assets/js/service-worker.js?v=1', { scope: '/assets/js/' });
      // For github pages
      const registration = await navigator.serviceWorker.register('service-worker-ghpages.js');

      console.log('Service Worker registered:', registration);

      //Ask for permission
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);

      if (permission !== 'granted') {
        console.warn('Permission not granted for notifications');
        return;
      }

      //Subscribe to Push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BPRvxQ24yz8iNO0uIYkS593ToRrv5l-HcEaR22LAzot22aa9pAOORQo1xVD2cpx0FPPMsnyT9ZEmo5pMai3N7rE'  // replace with your VAPID public key
      });

      const serializedSub = serializeSubscription(subscription);
      console.log('📬 Subscribing with:', serializedSub);

      //Send to backend
      const response = await fetch(`${http}://${url}/subscribe/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': await getCookie('csrftoken'),
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({ subscription: serializedSub }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Push subscription saved:', result);
      } else {
        const error = await response.json();
        console.error('Failed to save subscription:', error);
      }
    } catch (err) {
      console.error('Error during push registration:', err);
    }
  } else {
    console.warn('Push notifications are not supported in this browser.');
  }
});