import re

with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

# Replace the summation logic
old_logic = """
        if (p.status === 'PRESENTE' || p.status === 'ATESTADO MÉDICO') {
          agrupado[fId].dias += 1;
          agrupado[fId].total += agrupado[fId].valorDiaria;
        } else if (p.status === 'FALTOU') {
"""
new_logic = """
        // Use row's valor_diaria to support different rates (like Meia Diária)
        const rowValor = Number(p.valor_diaria) || 0;
        if (p.status === 'PRESENTE' || p.status === 'ATESTADO MÉDICO') {
          agrupado[fId].dias += 1;
          agrupado[fId].total += rowValor;
        } else if (p.status === 'MEIA DIÁRIA') {
          agrupado[fId].dias += 0.5;
          agrupado[fId].total += rowValor;
        } else if (p.status === 'FALTOU') {
"""

if "p.status === 'MEIA DIÁRIA'" not in content:
    content = content.replace(old_logic.strip(), new_logic.strip())

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
