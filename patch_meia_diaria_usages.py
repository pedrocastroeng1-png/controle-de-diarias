import re

with open('src/pages/admin/AuditoriaPresencas.tsx', 'r') as f:
    content = f.read()

content = content.replace("const isMeia = presenca.meia_diaria;", "const isMeia = presenca.tipo_diaria === 'MEIA_DIARIA';")
content = content.replace("p.id === presenca.id ? { ...p, meia_diaria: !isMeia } : p", "p.id === presenca.id ? { ...p, tipo_diaria: !isMeia ? 'MEIA_DIARIA' : 'DIARIA' } : p")
content = content.replace("setSelectedPresenca({ ...presenca, meia_diaria: !isMeia });", "setSelectedPresenca({ ...presenca, tipo_diaria: !isMeia ? 'MEIA_DIARIA' : 'DIARIA' });")

with open('src/pages/admin/AuditoriaPresencas.tsx', 'w') as f:
    f.write(content)

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace("if (p.meia_diaria) valor = valor / 2;", "if (p.tipo_diaria === 'MEIA_DIARIA') valor = valor / 2;")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

with open('src/lib/types.ts', 'r') as f:
    content = f.read()

content = content.replace("meia_diaria?: boolean;", "tipo_diaria?: string;")

with open('src/lib/types.ts', 'w') as f:
    f.write(content)

