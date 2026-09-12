import { Constants } from '../types/database.generated';
import type { Enums } from '../types/database.generated';

export function requireToolStatus(status: string): Enums<'tool_status'> {
  const supported = Constants.public.Enums.tool_status.find(value => value === status);
  if (!supported) throw new Error(`O status ${status} não existe no Supabase atual. Nenhuma alteração foi feita. É necessário definir esse fluxo antes de habilitá-lo.`);
  return supported;
}
