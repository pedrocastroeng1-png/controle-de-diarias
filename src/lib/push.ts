import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from './api';

export async function setupPushNotifications(userId: string) {
  if (Capacitor.isNativePlatform()) {
    // Native (Android/iOS via Capacitor)
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('User denied push permission');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token: ' + token.value);
      api.registerPushDevice(userId, token.value, Capacitor.getPlatform());
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
    });
  } else {
    // Web Push (PWA)
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Web Push not supported');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Web Push permission denied');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // We would need a VAPID public key from the backend to subscribe
      // For now, we will just try to get an existing subscription or mock it
      // since the prompt says "Prepare support for... The architecture should already be designed with this future expansion in mind."
      
      const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'; 
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      console.log('Web Push subscription successful:', subscription);
      // We send the endpoint/keys as a JSON string for the token
      api.registerPushDevice(userId, JSON.stringify(subscription), 'web');

    } catch (e) {
      console.error('Error subscribing to Web Push', e);
    }
  }
}

// Utility to convert Base64 string to Uint8Array
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
