import re

with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

content = content.replace("r.funcionario_id === f.id || r.funcionario === f.nome", "r.funcionario_nome === f.nome || r.funcionario === f.nome")

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
