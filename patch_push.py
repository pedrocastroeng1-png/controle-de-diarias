import re

with open('src/lib/push.ts', 'r') as f:
    content = f.read()

# We will replace the Web Push part of setupPushNotifications with the new Firebase logic.
web_push_code = """
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
      
      const registration = await navigator.serviceWorker.ready;
      
      const { initFirebase } = await import('./firebase');
      const { getMessaging, getToken } = await import('firebase/messaging');
      const { messaging } = initFirebase();
      
      if (!messaging) {
        console.log('Firebase messaging not initialized (missing config)');
        return;
      }
      
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (token) {
        console.log('Web Push subscription successful with FCM token');
        await api.registerPushDevice(userId, token, 'WEB');
      }
      
    } catch (e) {
      console.error('Error subscribing to Web Push via FCM', e);
    }
  }
"""

content = re.sub(r'\} else \{\s*// Web Push \(PWA\).*?\}\s*\}', web_push_code.strip() + '\n}', content, flags=re.DOTALL)

with open('src/lib/push.ts', 'w') as f:
    f.write(content)
