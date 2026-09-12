import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allVisibleSelected, toggleVisibleSelection } from '../src/lib/employee-selection';
import { saveEmployee } from '../src/lib/save-employee';
import type { Funcionario } from '../src/lib/types';
const payload = { nome: 'Teste', funcao_id: 'role', obra_id: 'obra', tipo_colaborador: 'DIARISTA' as const };
const employee: Funcionario = { ...payload, id: 'employee' };
const photo = {} as File;

test('mesma quantidade não significa mesmos funcionários selecionados', () => {
  assert.equal(allVisibleSelected(['a'], ['b']), false);
  assert.equal(allVisibleSelected(['a', 'b'], ['a']), true);
  assert.equal(allVisibleSelected([], []), false);
});
test('selecionar/desmarcar busca preserva seleção fora dela, sem duplicações', () => {
  assert.deepEqual(toggleVisibleSelection(['a', 'b'], ['b', 'c'], true), ['a', 'b', 'c']);
  assert.deepEqual(toggleVisibleSelection(['a', 'b', 'c'], ['b', 'c'], false), ['a']);
});
test('falha de foto após cadastro mantém ID para retry sem duplicar funcionário', async () => {
  let id: string | null = null; let creates = 0; let failed = true;
  const updates: unknown[] = [];
  const api = {
    createFuncionario: async () => { creates++; return employee; },
    updateFuncionario: async (id: string, data: unknown) => { updates.push([id, data]); },
    uploadEmployeePhoto: async () => { if (failed) throw new Error('Upload falhou'); return 'foto.jpg'; },
  };
  await assert.rejects(saveEmployee(api, id, payload, photo, false, f => { id = f.id; }));
  assert.equal(id, 'employee'); assert.equal(creates, 1); assert.equal(updates.length, 0);
  failed = false;
  await saveEmployee(api, id, payload, photo, false, () => assert.fail('não criar novamente'));
  assert.equal(creates, 1); assert.deepEqual(updates, [['employee', { ...payload, photo_path: 'foto.jpg' }]]);
});
test('falha de upload na edição não grava alterações parciais de cadastro', async () => {
  let writes = 0;
  const api = { createFuncionario: async () => employee, updateFuncionario: async () => { writes++; }, uploadEmployeePhoto: async (): Promise<string> => { throw new Error('Falha'); } };
  await assert.rejects(saveEmployee(api, 'employee', payload, photo, false, () => {}));
  assert.equal(writes, 0);
});
test('edição comum preserva foto e status; remoção da foto exige intenção explícita', async () => {
  const updates: Record<string, unknown>[] = [];
  const api = { createFuncionario: async () => employee, updateFuncionario: async (_: string, data: Record<string, unknown>) => { updates.push(data); }, uploadEmployeePhoto: async () => 'foto.jpg' };
  await saveEmployee(api, 'employee', payload, null, false, () => {});
  assert.equal('photo_path' in updates[0], false); assert.equal('ativo' in updates[0], false);
  await saveEmployee(api, 'employee', payload, null, true, () => {});
  assert.equal(updates[1].photo_path, null);
});
