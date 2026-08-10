import re

with open('src/lib/firebase.ts', 'r') as f:
    content = f.read()

content = content.replace(
"""export const onMessageListener = () => {
  const { messaging } = initFirebase();
  if (!messaging) return new Promise((resolve) => {});
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};""",
"""export const onMessageListener = (callback: (payload: any) => void) => {
  const { messaging } = initFirebase();
  if (!messaging) return;
  return onMessage(messaging, callback);
};"""
)

with open('src/lib/firebase.ts', 'w') as f:
    f.write(content)
