with open('src/lib/types.ts', 'r') as f:
    content = f.read()

content = content.replace(
    'presente: boolean;',
    'presente: boolean;\n  meia_diaria?: boolean;'
)

with open('src/lib/types.ts', 'w') as f:
    f.write(content)
