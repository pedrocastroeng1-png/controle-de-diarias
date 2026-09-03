with open('src/lib/types.ts', 'r') as f:
    code = f.read()

old_code = """  tipo_conta?: "CONTA CORRENTE" | "CONTA POUPANÇA" | null;
  conta?: string | null;
  chave_pix?: string | null;
  observacao_pagamento?: string | null;
  funcao?: Funcao;
  obra?: Obra;
}"""

new_code = """  tipo_conta?: "CONTA CORRENTE" | "CONTA POUPANÇA" | null;
  conta?: string | null;
  chave_pix?: string | null;
  observacao_pagamento?: string | null;
  data_admissao?: string | null;
  data_desligamento?: string | null;
  funcao?: Funcao;
  obra?: Obra;
}"""

code = code.replace(old_code, new_code)

with open('src/lib/types.ts', 'w') as f:
    f.write(code)
