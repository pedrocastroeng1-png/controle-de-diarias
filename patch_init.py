import re

with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

old_init = """export const initFirebase = () => {
  if (!app && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }
  return { app, messaging };
};"""

new_init = """export const initFirebase = () => {
  if (!app) {
    try {
      if (firebaseConfig.projectId) {
        app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
      }
    } catch (e) {
      console.error("Firebase init error:", e);
    }
  }
  return { app, messaging };
};"""

if old_init in content:
    content = content.replace(old_init, new_init)
else:
    print("old_init not found")

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)

