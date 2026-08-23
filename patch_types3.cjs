const fs = require('fs');
let code = fs.readFileSync('src/lib/types.ts', 'utf-8');

const newTypes = `
export interface MaterialQuantityDetail {
  id: string;
  data_compra: string;
  fornecedor?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface MaterialQuantityRow {
  material_id: string;
  material_nome: string;
  unidade: string;
  categoria_id: string;
  categoria_nome: string;
  obra_id?: string;
  obra_nome?: string;
  quantidade_total: number;
  registros: MaterialQuantityDetail[];
}
`;

code = code + '\n' + newTypes;
fs.writeFileSync('src/lib/types.ts', code, 'utf-8');
