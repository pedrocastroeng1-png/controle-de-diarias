with open('src/pages/admin/ComprasMateriaisTab.tsx', 'r') as f:
    content = f.read()

# Replace where it displays fornecedor in the table
content = content.replace(
    "{compra.fornecedor || '-'}",
    "{compra.fornecedor_rel?.nome || compra.fornecedor || '-'}"
)

# Replace where it displays in the details view
content = content.replace(
    "{selectedCompra.fornecedor || '-'}",
    "{selectedCompra.fornecedor_rel?.nome || selectedCompra.fornecedor || '-'}"
)

# Replace in the search filter
content = content.replace(
    "c.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase())",
    "(c.fornecedor_rel?.nome || c.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase())"
)

with open('src/pages/admin/ComprasMateriaisTab.tsx', 'w') as f:
    f.write(content)
