import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataEmMaceio, funcionariosNasObras, custoDasObras } from '../src/lib/dashboard-data';
import { withEmpresa, addEmpresaId } from '../src/lib/company-scope';
import type { Funcionario, Presenca } from '../src/lib/types';
import type { RegistroRelatorio } from '../src/lib/atestados-relatorio';

test('hoje usa Maceió na virada do dia e do ano, independente do dispositivo', () => {
  assert.equal(dataEmMaceio(new Date('2026-01-01T02:59:59Z')), '2025-12-31');
  assert.equal(dataEmMaceio(new Date('2026-01-01T03:00:00Z')), '2026-01-01');
});
test('transferência de funcionário não move uma presença já registrada para outra obra', () => {
  const emps = [{ id: 'a', obra_id: 'nova' }, { id: 'b', obra_id: 'nova' }] as Funcionario[];
  const pres = [{ funcionario_id: 'a', obra_id: 'antiga' }] as Presenca[];
  assert.deepEqual(funcionariosNasObras(emps, pres, ['antiga']).map(f => f.id), ['a']);
  assert.deepEqual(funcionariosNasObras(emps, pres, ['nova']).map(f => f.id), ['b']);
  assert.equal(funcionariosNasObras(emps, pres, ['antiga', 'nova']).length, 2);
});
test('custo do painel inclui atestado, respeita meia diária e não soma falta ou CLT', () => {
  const rows = [
    { obra_id: 'principal', status: 'PRESENTE', valor_calculado: 70 },
    { obra_id: 'filha', status: 'ATESTADO MÉDICO', valor_calculado: 140 },
    { obra_id: 'filha', status: 'FALTOU', valor_calculado: 140 },
    { obra_id: 'filha', status: 'PRESENTE', tipo_colaborador: 'CLT', valor_calculado: 140 },
  ] as RegistroRelatorio[];
  assert.equal(custoDasObras(rows), 210);
  assert.equal(custoDasObras(rows, ['principal']), 70);
  assert.equal(custoDasObras(rows, ['filha']), 140);
  assert.equal(custoDasObras(rows, []), 0);
});
test('sem sessão/empresa, consulta e inclusão são bloqueadas antes de acessar o builder', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
    let called = false;
    assert.throws(() => withEmpresa({ eq: () => { called = true; } }), /Empresa não identificada/);
    assert.throws(() => addEmpresaId({ nome: 'Teste' }), /Empresa não identificada/);
    assert.equal(called, false);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => JSON.stringify({ empresa_id: 'empresa' }) } });
    const filters: unknown[] = [];
    const builder = { eq: (...args: unknown[]) => { filters.push(args); return builder; } };
    assert.equal(withEmpresa(builder), builder);
    const table = { select: () => builder, update: () => builder, delete: () => builder };
    withEmpresa(table).select(); withEmpresa(table).update(); withEmpresa(table).delete();
    assert.deepEqual(filters, Array.from({ length: 4 }, () => ['empresa_id', 'empresa']));
    assert.deepEqual(addEmpresaId([{ nome: 'Teste' }]), [{ nome: 'Teste', empresa_id: 'empresa' }]);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
