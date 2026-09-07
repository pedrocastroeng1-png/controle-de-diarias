with open('src/lib/excel/geradorPlanilhaMateriais.ts', 'r') as f:
    content = f.read()

content = content.replace(
    "fornecedor: row.fornecedor || '-',",
    "fornecedor: row.fornecedor_rel?.nome || row.fornecedor || '-',"
)

with open('src/lib/excel/geradorPlanilhaMateriais.ts', 'w') as f:
    f.write(content)
