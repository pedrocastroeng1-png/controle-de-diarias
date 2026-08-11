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
    // Web Push (PWA) using Firebase Cloud Messaging
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
      
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('Registering service worker manually...');
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      
      registration = await navigator.serviceWorker.ready;
      console.log('Service worker is ready.');
      
      const { initFirebase } = await import('./firebase');
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { messaging } = initFirebase();
      
      if (!messaging) {
        console.log('Firebase messaging not initialized (missing config)');
        return;
      }
      
      console.log('VAPID Key available:', !!import.meta.env.VITE_FIREBASE_VAPID_KEY);
      
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (token) {
        console.log(`FCM token generated: true`);
        await api.registerPushDevice(userId, token, 'WEB');
        localStorage.setItem('@diarias:push_token', token);
      } else {
        console.log(`FCM token generated: false`);
        throw new Error('FCM token was not generated');
      }
      
    } catch (e) {
      console.error('Error subscribing to Web Push via FCM', e);
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
