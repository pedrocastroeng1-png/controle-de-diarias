import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Update Presencas select
content = content.replace(
    ".select(`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))`)\n      .or",
    ".select(`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))`)\n      .or"
)

# Update getDashboardStats logic for meia_diaria
dashboard_logic = """
    presencasHojeData?.forEach(p => {
      if (p.presente) {
        presentesHoje++;
        let valor = Number((p.funcionario as any)?.funcao?.valor_diaria || 0);
        if (p.meia_diaria) valor = valor / 2;
        valorTotalHoje += valor;
      } else {
"""
content = re.sub(
    r'presencasHojeData\?\.forEach\(p => \{\s*if \(p\.presente\) \{\s*presentesHoje\+\+;\s*valorTotalHoje \+= Number\(\(p\.funcionario as any\)\?\.funcao\?\.valor_diaria \|\| 0\);\s*\} else \{',
    dashboard_logic.strip(),
    content
)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
