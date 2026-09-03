import re

with open('src/lib/types.ts', 'r') as f:
    code = f.read()

code = code.replace(
"""export interface Obra {
  id: string;
  nome: string;
}""",
"""export interface Obra {
  id: string;
  nome: string;
  ativo?: boolean;
  parent_obra_id?: string | null;
}""")

with open('src/lib/types.ts', 'w') as f:
    f.write(code)
