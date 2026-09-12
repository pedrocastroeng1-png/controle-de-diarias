import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fornecedorIdFromResult } from '../src/lib/rpc-results';
import { requireToolStatus } from '../src/lib/tool-status';

test('extrai UUID de retorno tabular, tanto novo como já existente', () => {
  for (const criado_agora of [true, false]) {
    assert.equal(fornecedorIdFromResult([{ fornecedor_id: 'supplier-id', criado_agora }]), 'supplier-id');
  }
});
test('não transforma ausência de retorno em sucesso', () => {
  assert.throws(() => fornecedorIdFromResult(null));
  assert.throws(() => fornecedorIdFromResult([]));
});
test('status inexistente é bloqueado antes de escrever no banco', () => {
  assert.throws(() => requireToolStatus('QUEBRADA'), /não existe no Supabase/);
  assert.equal(requireToolStatus('EM_REPARO'), 'EM_REPARO');
});
