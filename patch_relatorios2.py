import re

with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

content = content.replace("agrupado[fId].dias += 0.5;", "agrupado[fId].dias += 1;")

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
