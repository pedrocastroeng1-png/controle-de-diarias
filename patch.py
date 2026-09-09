with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'const fId = p.funcionario_id || p.funcionario;',
    'const fId = p.funcionario_id || p.funcionario;\n        if (p.eh_clt || p.tipo_colaborador === "CLT") return;'
)

content = content.replace(
    'let pStatus = \'✘ Faltou\';',
    'if (p.eh_clt || p.tipo_colaborador === "CLT") return;\n        let pStatus = \'✘ Faltou\';'
)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
