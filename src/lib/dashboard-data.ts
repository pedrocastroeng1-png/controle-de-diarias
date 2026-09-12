import { valorFinanceiro, type RegistroRelatorio } from './atestados-relatorio';
import type { Funcionario, Presenca } from './types';

export function dataEmMaceio(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Maceio', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (type: string) => parts.find(p => p.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

/** A saved attendance locates the employee on that day, even after a transfer. */
export function funcionariosNasObras(funcionarios: Funcionario[], presencas: Presenca[], obraIds: string[]): Funcionario[] {
  const locations = new Map(presencas.map(p => [p.funcionario_id, p.obra_id]));
  const ids = new Set(obraIds);
  return funcionarios.filter(f => ids.has(locations.get(f.id) ?? f.obra_id));
}

export function custoDasObras(registros: RegistroRelatorio[], obraIds?: string[]): number {
  const ids = obraIds ? new Set(obraIds) : null;
  return registros.reduce((cents, r) => cents + ((!ids || (r.obra_id && ids.has(r.obra_id))) ? Math.round(valorFinanceiro(r) * 100) : 0), 0) / 100;
}
