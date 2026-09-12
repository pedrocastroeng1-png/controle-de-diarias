import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aplicarAtestados, diasUteisAtestado, valorFinanceiro, type RegistroRelatorio } from '../src/lib/atestados-relatorio';
import type { Funcionario } from '../src/lib/types';

const funcionario: Funcionario = { id: 'f1', empresa_id: 'e1', nome: 'Pessoa de teste', funcao_id: 'job', obra_id: 'work', tipo_colaborador: 'DIARISTA', ativo: true, funcao: { id: 'job', nome: 'Servente', valor_diaria: 80 }, obra: { id: 'work', nome: 'Obra de teste', ativo: true } };
const atestado = { id: 'a1', employee_id: 'f1', empresa_id: 'e1', start_date: '2026-09-11', end_date: '2026-09-14', description: null, photo_path: null };
function linha(overrides: Partial<RegistroRelatorio> = {}): RegistroRelatorio {
  return { id: 'presence', data: '2026-09-11', status: 'PRESENTE', funcionario_id: 'f1', funcionario: 'Pessoa de teste', funcao: 'Servente', valor_diaria: 80, tipo_colaborador: 'DIARISTA', eh_clt: false, obra: 'Obra de teste', obra_principal: 'Obra de teste', subobra_id: null, subobra: null, tipo_diaria: 'DIARIA', percentual_diaria: 100, valor_calculado: 80, valor_relatorio: '80.00', obra_id: 'work', empresa_id: 'e1', data_admissao: null, data_desligamento: null, funcionario_ativo: true, obra_ativa: true, ...overrides };
}

test('sexta a segunda gera somente duas diárias, inclusive em fuso com DST', () => {
  assert.deepEqual(diasUteisAtestado('2026-09-11', '2026-09-14'), ['2026-09-11', '2026-09-14']);
  assert.deepEqual(diasUteisAtestado('2026-03-06', '2026-03-09'), ['2026-03-06', '2026-03-09']);
  const rows = aplicarAtestados([], [atestado], [funcionario]);
  assert.equal(rows.reduce((sum, row) => sum + valorFinanceiro(row), 0), 160);
  assert.ok(rows.every(row => row.funcionario_id === 'f1' && row.percentual_diaria === 100));
});
test('atestado somente no fim de semana não gera pagamento', () => {
  assert.deepEqual(aplicarAtestados([], [{ ...atestado, start_date: '2026-09-12', end_date: '2026-09-13' }], [funcionario]), []);
});
test('presença ou falta no mesmo dia vira uma diária integral, sem duplicação', () => {
  for (const status of ['PRESENTE', 'FALTOU']) {
    const rows = aplicarAtestados([linha({ status })], [{ ...atestado, end_date: '2026-09-11' }], [funcionario]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status_original, status);
    assert.equal(valorFinanceiro(rows[0]), 80);
    assert.equal(rows[0].status, 'ATESTADO MÉDICO');
  }
});
test('meia diária com atestado gera 100%, não 150%', () => {
  const rows = aplicarAtestados([linha({ tipo_diaria: 'MEIA_DIARIA', percentual_diaria: 50, valor_calculado: 40 })], [{ ...atestado, end_date: '2026-09-11' }], [funcionario]);
  assert.equal(rows.length, 1);
  assert.equal(valorFinanceiro(rows[0]), 80);
  assert.equal(rows[0].tipo_diaria, 'DIARIA');
});
test('atestados sobrepostos preservam IDs mas pagam cada dia uma vez', () => {
  const rows = aplicarAtestados([], [atestado, { ...atestado, id: 'a2' }], [funcionario]);
  assert.equal(rows.length, 2);
  assert.equal(rows.reduce((sum, row) => sum + valorFinanceiro(row), 0), 160);
  assert.deepEqual(rows[0].atestado_ids, ['a1', 'a2']);
});
test('limita à seleção e ao vínculo, sem excluir inativo pelo status atual', () => {
  const rows = aplicarAtestados([], [atestado], [{ ...funcionario, ativo: false, data_admissao: '2026-09-11', data_desligamento: '2026-09-11' }], { inicio: '2026-09-11', fim: '2026-09-14' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].data, '2026-09-11');
  assert.equal(aplicarAtestados([], [atestado], [funcionario], { inicio: '2026-09-14' }).length, 1);
});
test('obra da presença histórica prevalece e é filtrada depois da deduplicação', () => {
  const original = linha({ obra_id: 'old-work', obra: 'Obra antiga' });
  const cert = { ...atestado, end_date: '2026-09-11' };
  assert.equal(aplicarAtestados([original], [cert], [funcionario], { obraId: 'work' }).length, 0);
  assert.equal(aplicarAtestados([original], [cert], [funcionario], { obraId: 'old-work' }).length, 1);
});
test('CLT não ganha diária e sua presença permanece', () => {
  const rows = aplicarAtestados([linha({ tipo_colaborador: 'CLT', eh_clt: true, valor_calculado: null })], [atestado], [{ ...funcionario, tipo_colaborador: 'CLT' }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].status, 'PRESENTE');
  assert.equal(valorFinanceiro(rows[0]), 0);
});
test('nomes iguais não fundem funcionários diferentes', () => {
  const rows = aplicarAtestados([], [atestado, { ...atestado, id: 'a2', employee_id: 'f2' }], [funcionario, { ...funcionario, id: 'f2' }]);
  assert.equal(rows.length, 4);
});
test('zero continua zero e falta não usa o valor base', () => {
  assert.equal(valorFinanceiro(linha({ valor_calculado: 0 })), 0);
  assert.equal(valorFinanceiro(linha({ status: 'FALTOU' })), 0);
});
test('rejeita datas inválidas e divergência de empresa', () => {
  assert.throws(() => diasUteisAtestado('2026-02-30', '2026-03-02'));
  assert.throws(() => diasUteisAtestado('2026-09-14', '2026-09-11'));
  assert.throws(() => aplicarAtestados([], [{ ...atestado, empresa_id: 'other' }], [funcionario]), /empresa/);
});
