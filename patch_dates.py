with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

content = content.replace('const day = d.getDay();', 'const day = d.getUTCDay();')
content = content.replace('[\'Dom\', \'Seg\', \'Ter\', \'Qua\', \'Qui\', \'Sex\', \'Sáb\'][d.getDay()]', '[\'Dom\', \'Seg\', \'Ter\', \'Qua\', \'Qui\', \'Sex\', \'Sáb\'][d.getUTCDay()]')

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
