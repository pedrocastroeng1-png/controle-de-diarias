with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'const diaristasAgrupado = Object.values(diaristasMap).sort((a, b) => a.nome.localeCompare(b.nome));',
    'const diaristasAgrupado = Object.values(diaristasMap).filter((a: any) => a.total > 0 || a.dias > 0).sort((a, b) => a.nome.localeCompare(b.nome));'
)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
