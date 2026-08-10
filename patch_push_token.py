with open('src/lib/push.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "await api.registerPushDevice(userId, token, 'WEB');",
    "await api.registerPushDevice(userId, token, 'WEB');\n        localStorage.setItem('@diarias:push_token', token);"
)

with open('src/lib/push.ts', 'w') as f:
    f.write(content)
