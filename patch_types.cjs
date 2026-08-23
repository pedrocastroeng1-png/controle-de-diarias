const fs = require('fs');
let types = fs.readFileSync('src/lib/types.ts', 'utf-8');

const newTypes = `
export interface MaterialCategory {
  id: string;
  nome: string;
  descricao?: string;
  is_epi?: boolean;
  created_at?: string;
}

export interface Material {
  id: string;
  category_id: string;
  nome: string;
  descricao?: string;
  unidade: string;
  is_epi?: boolean;
  created_at?: string;
  
  category?: MaterialCategory;
}

export interface CompraMaterial {
  id: string;
  obra_id: string;
  fornecedor?: string;
  numero_recibo?: string;
  observacao?: string;
  total: number;
  data_compra: string;
  registrado_por: string;
  created_at?: string;
  
  obra?: Obra;
  registrador?: { usuario: string };
  itens?: CompraMaterialItem[];
}

export interface CompraMaterialItem {
  id: string;
  compra_id: string;
  material_id: string;
  quantidade: number;
  valor_unitario: number;
  total_item: number;
  created_at?: string;
  
  material?: Material;
}
`;

types = types + '\n' + newTypes;
fs.writeFileSync('src/lib/types.ts', types, 'utf-8');
