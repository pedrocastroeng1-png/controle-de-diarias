with open('src/lib/push.ts', 'r') as f:
    content = f.read()

content = content.replace('  }\n}\n}\n\n// Utility', '  }\n}\n\n// Utility')

with open('src/lib/push.ts', 'w') as f:
    f.write(content)
