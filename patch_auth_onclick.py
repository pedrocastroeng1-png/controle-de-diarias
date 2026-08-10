import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""          new Notification(title, {
            body: body,
            icon: '/logo.png',
            data: payload.data
          });""",
"""          const notification = new Notification(title, {
            body: body,
            icon: '/logo.png',
            data: payload.data
          });
          notification.onclick = (event) => {
            event.preventDefault();
            notification.close();
            const data = payload.data || {};
            let targetUrl = '/';
            if (data.route) targetUrl = data.route;
            else if (data.link) targetUrl = data.link;
            else if (data.communication_id) targetUrl = '/admin/comunicacoes';
            else if (data.presenca_id) targetUrl = '/admin/auditoria';
            window.location.href = targetUrl;
          };"""
)

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(content)
