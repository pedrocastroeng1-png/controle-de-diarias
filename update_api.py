with open('src/lib/api.ts', 'r') as f:
    content = f.read()

content = content.replace(
    '"*, obra:obras(nome), registrador:usuarios!registrado_por(usuario), itens:compras_materiais_itens(valor_total)",',
    '"*, obra:obras(nome), fornecedor_rel:fornecedores(nome), registrador:usuarios!registrado_por(usuario), itens:compras_materiais_itens(valor_total)",'
)

# Also update getCompraDetalhes
content = content.replace(
    '"*, obra:obras(nome), registrador:usuarios!registrado_por(usuario)",',
    '"*, obra:obras(nome), fornecedor_rel:fornecedores(nome), registrador:usuarios!registrado_por(usuario)",'
)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
