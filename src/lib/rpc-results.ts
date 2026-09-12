import type { Database } from '../types/database.generated';

type FornecedorResult = Database['public']['Functions']['cadastrar_fornecedor_rapido']['Returns'];
export function fornecedorIdFromResult(data: FornecedorResult | null): string {
  if (!data || data.length !== 1 || !data[0].fornecedor_id) {
    throw new Error('O banco não retornou exatamente um fornecedor.');
  }
  return data[0].fornecedor_id;
}
