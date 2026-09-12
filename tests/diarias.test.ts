import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularDiaria } from '../src/lib/diarias';

test('diária integral corresponde a 100% da função', () => {
  assert.equal(calcularDiaria({ presente: true, valor_diaria: 140, percentual_diaria: 100 }), 140);
});
test('meia diária aplica 50% uma única vez mesmo com tipo e percentual', () => {
  assert.equal(calcularDiaria({ presente: true, valor_diaria: 140, percentual_diaria: 50, tipo_diaria: 'MEIA_DIARIA' }), 70);
});
test('percentual informado pelo banco prevalece sobre fallback de tipo', () => {
  assert.equal(calcularDiaria({ presente: true, valor_diaria: 160, percentual_diaria: 50 }), 80);
});
test('falta não vira presença quando o tipo é meia diária', () => {
  assert.equal(calcularDiaria({ presente: false, valor_diaria: 140, percentual_diaria: 50, tipo_diaria: 'MEIA_DIARIA' }), 0);
});
test('CLT não recebe cálculo de diária', () => {
  assert.equal(calcularDiaria({ presente: true, valor_diaria: 140, percentual_diaria: 100, tipo_colaborador: 'CLT' }), 0);
});
test('zero permanece zero', () => {
  assert.equal(calcularDiaria({ presente: true, valor_diaria: 0, percentual_diaria: 50 }), 0);
});
test('arredonda centavos e rejeita valores inválidos', () => {
  assert.equal(calcularDiaria({ presente: true, valor_diaria: 80.01, percentual_diaria: 50 }), 40.01);
  assert.throws(() => calcularDiaria({ presente: true, valor_diaria: 140, percentual_diaria: 25 }));
  assert.throws(() => calcularDiaria({ presente: true, valor_diaria: NaN }));
});
