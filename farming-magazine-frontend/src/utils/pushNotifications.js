// Utility for subscribing to web push notifications
// Replace with your actual VAPID public key (from your backend or push service)
const VAPID_PUBLIC_KEY = 'YOUR_PUBLIC_VAPID_KEY_HERE';

// Convert base64 public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeUserToPush() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      // TODO: Send subscription to your backend to save for this user
      // await fetch('/api/save-subscription', { method: 'POST', body: JSON.stringify(subscription) });
      return subscription;
    } catch (error) {
      console.error('Push subscription error:', error);
      throw error;
    }
  } else {
    throw new Error('Push messaging is not supported');
  }
}
