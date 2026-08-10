import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Fix select in getDashboardStats
old_select = ".select('presente, funcionario:funcionarios!inner(tipo_colaborador, funcao:funcoes(valor_diaria))')"
new_select = ".select('presente, meia_diaria, funcionario:funcionarios!inner(tipo_colaborador, funcao:funcoes(valor_diaria))')"

content = content.replace(old_select, new_select)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
