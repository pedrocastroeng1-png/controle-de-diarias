with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

bad_str = """        if (p.eh_clt || p.tipo_colaborador === "CLT") return;
        let pStatus = '✘ Faltou';
        if (row.status === 'ATESTADO MÉDICO') pStatus = '🩺 Atestado';"""

good_str = """        let pStatus = '✘ Faltou';
        if (row.status === 'ATESTADO MÉDICO') pStatus = '🩺 Atestado';"""

content = content.replace(bad_str, good_str)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
