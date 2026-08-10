import re

with open('src/sw.ts', 'r') as f:
    content = f.read()

push_handler = """// Web Push Notification Support
self.addEventListener('push', (event: any) => {
  let title = 'Nova Notificação';
  let body = 'Você tem uma nova mensagem.';
  let dataPayload: any = {};
  
  if (event.data) {
    try {
      const payload = event.data.json();
      
      // Handle standard FCM structure
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      } else if (payload.title || payload.body || payload.message) {
        title = payload.title || title;
        body = payload.body || payload.message || body;
      }
      
      if (payload.data) {
        dataPayload = payload.data;
      }
    } catch (e) {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/logo.png',
      badge: '/logo.png',
      data: dataPayload
    })
  );
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients: any) => {
      let targetUrl = '/';
      
      if (event.notification.data) {
        if (event.notification.data.route) {
          targetUrl = event.notification.data.route;
        } else if (event.notification.data.link) {
          targetUrl = event.notification.data.link;
        } else if (event.notification.data.communication_id) {
          targetUrl = '/admin/comunicacoes';
        } else if (event.notification.data.presenca_id) {
          targetUrl = '/admin/auditoria';
        }
      }

      // Check if there is already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      
      // If not, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
"""

# replace everything from // Web Push Notification Support to the end
content = re.sub(r'// Web Push Notification Support.*', push_handler, content, flags=re.DOTALL)

with open('src/sw.ts', 'w') as f:
    f.write(content)
