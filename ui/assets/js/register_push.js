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

window.addEventListener('load', async () => {
  try {
    if (!authToken) {
      console.warn('Cannot subscribe: authToken is missing.');
      return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.register('/service-worker-ghpages.js', {
        scope: '/'
      });
      // const registration = await navigator.serviceWorker.register('/assets/js/service-worker.js', {
      //   scope: '/' // not '/assets/js/'
      // });
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Permission not granted for notifications');
        return;
      }

      const readyRegistration = await navigator.serviceWorker.ready;


      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BPRvxQ24yz8iNO0uIYkS593ToRrv5l-HcEaR22LAzot22aa9pAOORQo1xVD2cpx0FPPMsnyT9ZEmo5pMai3N7rE'
      });

      const serializedSub = serializeSubscription(subscription);

      
      const response = await fetch(`${http}://${url}/subscribe/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': await getCookie('csrftoken'),
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify({ subscription: serializedSub }),
      });

    } else {
      console.warn('Push notifications are not supported in this browser.');
    }

  } catch (err) {
    console.error('Error in service worker load event:', err);
  }
});
