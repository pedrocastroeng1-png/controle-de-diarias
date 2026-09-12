import type { Tables } from '../types/database.generated';
import type { Funcionario } from './types';
import { calcularDiaria } from './diarias';

export type RegistroRelatorio = Tables<'vw_relatorio_presencas'> & {
  atestado_original_id?: string;
  atestado_ids?: string[];
  atestado_description?: string | null;
  atestado_photo_path?: string | null;
  status_original?: string | null;
};
type Atestado = Pick<Tables<'medical_certificates'>, 'id' | 'employee_id' | 'empresa_id' | 'start_date' | 'end_date' | 'description' | 'photo_path'>;
type Filtro = { inicio?: string; fim?: string; obraId?: string };

/** Civil dates in UTC: weekday selection must not depend on browser timezone/DST. */
export function diasUteisAtestado(inicio: string, fim: string): string[] {
  const parse = (value: string) => {
    const date = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Data de atestado inválida.');
    return date;
  };
  const date = parse(inicio);
  const end = parse(fim);
  if (date > end) throw new Error('Período de atestado inválido.');
  const result: string[] = [];
  while (date <= end) {
    if (date.getUTCDay() >= 1 && date.getUTCDay() <= 5) result.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return result;
}

/** One financial record per employee/day; certificates replace, never add to, attendance. */
export function aplicarAtestados(registros: RegistroRelatorio[], atestados: Atestado[], funcionarios: Funcionario[], filtro: Filtro = {}): RegistroRelatorio[] {
  const key = (empresa: string | null | undefined, funcionario: string, data: string) => `${empresa}:${funcionario}:${data}`;
  const result = new Map<string, RegistroRelatorio>();
  for (const row of registros) {
    if (!row.funcionario_id || !row.data) throw new Error('Registro sem funcionário ou data.');
    const id = key(row.empresa_id, row.funcionario_id, row.data);
    if (result.has(id)) throw new Error('Presenças duplicadas para o mesmo funcionário e dia.');
    result.set(id, { ...row });
  }
  const employees = new Map(funcionarios.map(f => [f.id, f]));
  for (const certificate of [...atestados].sort((a, b) => a.id.localeCompare(b.id))) {
    const employee = employees.get(certificate.employee_id);
    if (!employee || employee.empresa_id !== certificate.empresa_id) throw new Error('Atestado sem funcionário correspondente na empresa.');
    if (employee.tipo_colaborador !== 'DIARISTA') continue;
    for (const data of diasUteisAtestado(certificate.start_date, certificate.end_date)) {
      if ((filtro.inicio && data < filtro.inicio) || (filtro.fim && data > filtro.fim)) continue;
      if ((employee.data_admissao && data < employee.data_admissao) || (employee.data_desligamento && data > employee.data_desligamento)) continue;
      const id = key(certificate.empresa_id, employee.id, data);
      const current = result.get(id);
      const valorDiaria = current?.valor_diaria ?? employee.funcao?.valor_diaria;
      if (valorDiaria == null) throw new Error('Funcionário sem valor de diária para calcular o atestado.');
      const valor = calcularDiaria({ presente: true, tipo_colaborador: 'DIARISTA', valor_diaria: valorDiaria, percentual_diaria: 100 });
      const row: RegistroRelatorio = current ?? {
        id: null, data, funcionario_id: employee.id, funcionario: employee.nome,
        empresa_id: certificate.empresa_id, funcao: employee.funcao?.nome ?? null,
        obra_id: employee.obra_id, obra: employee.obra?.nome ?? null,
        obra_principal: null, subobra_id: employee.obra?.parent_obra_id ? employee.obra_id : null,
        subobra: employee.obra?.parent_obra_id ? employee.obra.nome : null,
        tipo_colaborador: 'DIARISTA', eh_clt: false, valor_diaria: valorDiaria,
        data_admissao: employee.data_admissao ?? null, data_desligamento: employee.data_desligamento ?? null,
        funcionario_ativo: employee.ativo ?? null, obra_ativa: employee.obra?.ativo ?? null,
        status: 'ATESTADO MÉDICO', tipo_diaria: 'DIARIA', percentual_diaria: 100,
        valor_calculado: valor, valor_relatorio: valor.toFixed(2),
      };
      result.set(id, { ...row, status_original: row.atestado_ids ? row.status_original : (current ? row.status : null),
        status: 'ATESTADO MÉDICO', tipo_diaria: 'DIARIA', percentual_diaria: 100,
        valor_calculado: valor, valor_relatorio: valor.toFixed(2),
        atestado_original_id: row.atestado_original_id ?? certificate.id,
        atestado_ids: [...new Set([...(row.atestado_ids ?? []), certificate.id])],
        atestado_description: row.atestado_description ?? certificate.description,
        atestado_photo_path: row.atestado_photo_path ?? certificate.photo_path,
      });
    }
  }
  return [...result.values()].filter(row => (!filtro.inicio || row.data! >= filtro.inicio) && (!filtro.fim || row.data! <= filtro.fim) && (!filtro.obraId || row.obra_id === filtro.obraId))
    .sort((a, b) => b.data!.localeCompare(a.data!) || (a.funcionario ?? '').localeCompare(b.funcionario ?? '') || a.funcionario_id!.localeCompare(b.funcionario_id!));
}

export function valorFinanceiro(row: Pick<RegistroRelatorio, 'status' | 'eh_clt' | 'tipo_colaborador' | 'valor_calculado' | 'valor_diaria' | 'percentual_diaria' | 'tipo_diaria'>): number {
  if (row.eh_clt || row.tipo_colaborador === 'CLT' || !['PRESENTE', 'ATESTADO MÉDICO', 'MEIA_DIARIA', 'MEIA DIÁRIA'].includes(row.status ?? '')) return 0;
  return row.valor_calculado ?? calcularDiaria({ presente: true, tipo_colaborador: row.tipo_colaborador, valor_diaria: row.valor_diaria, percentual_diaria: row.percentual_diaria, tipo_diaria: row.tipo_diaria });
}
