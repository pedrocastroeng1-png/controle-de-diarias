import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    content = f.read()

# Add imports
if 'onMessageListener' not in content:
    content = content.replace("import { setupPushNotifications } from '../lib/push';", "import { setupPushNotifications } from '../lib/push';\nimport { onMessageListener } from '../lib/firebase';")

# Add the effect
effect = """  useEffect(() => {
    let unsubscribe: any = null;
    try {
      unsubscribe = onMessageListener((payload) => {
        let title = 'Nova Notificação';
        let body = 'Você tem uma nova mensagem.';
        
        if (payload.notification) {
          title = payload.notification.title || title;
          body = payload.notification.body || body;
        } else if (payload.data && (payload.data.title || payload.data.message || payload.data.body)) {
          title = payload.data.title || title;
          body = payload.data.body || payload.data.message || body;
        }
        
        // Se a tab está aberta, podemos mostrar um alerta customizado ou nativo
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: body,
            icon: '/logo.png',
            data: payload.data
          });
        } else {
          alert(`${title}\\n${body}`);
        }
      });
    } catch (e) {
      console.error('Error setting up foreground push listener:', e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
"""

if 'onMessageListener((payload)' not in content:
    content = content.replace("  useEffect(() => {\n    const initAuth = async", effect + "\n  useEffect(() => {\n    const initAuth = async")

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(content)
