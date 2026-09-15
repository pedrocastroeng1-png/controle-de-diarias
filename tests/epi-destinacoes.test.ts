import test from 'node:test';
import assert from 'node:assert/strict';
import { distribuirItemEpi, distribuirEpiEntreObras, redimensionarDestinacoes } from '../src/lib/epi-destinacoes.ts';

const item = { material_id: 'luva', quantidade: 3, valor_unitario: 10, unidade_compra: 'PAR' };
const permitidos = new Set(['a', 'b', 'c']);

test('EPI em duas obras conserva rateio 20/10 e total 30', () => {
  const linhas = distribuirEpiEntreObras(item, ['a', 'a', 'b'], ['obra1','obra1','obra2'], [{id:'a',obra_id:'obra1'},{id:'b',obra_id:'obra2'}], new Set(['obra1','obra2']));
  const totais = linhas.reduce((acc, l) => { acc[l.obra_destino_id] = (acc[l.obra_destino_id] || 0) + l.quantidade*l.valor_unitario; return acc; }, {} as Record<string,number>);
  assert.deepEqual(totais, {obra1:20,obra2:10});
});
test('bloqueia obra ausente, não permitida ou incompatível com funcionário', () => {
  const funcs = [{id:'a',obra_id:'obra1'},{id:'b',obra_id:'obra2'}];
  for (const obras of [[],['obra1','obra1',''],['obra1','obra1','outra'],['obra1','obra1','obra1']])
    assert.throws(() => distribuirEpiEntreObras(item,['a','a','b'],obras,funcs,new Set(['obra1','obra2'])));
});

test('três pares para três funcionários mantêm quantidade, unidade e custo total', () => {
  const itens = distribuirItemEpi(item, ['a', 'b', 'c'], permitidos);
  assert.deepEqual(itens.map(i => [i.funcionario_id, i.quantidade, i.unidade_compra]), [['a', 1, 'PAR'], ['b', 1, 'PAR'], ['c', 1, 'PAR']]);
  assert.equal(itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0), 30);
});
test('mesmo funcionário pode receber dois pares sem duplicar custo', () => {
  const itens = distribuirItemEpi(item, ['a', 'a', 'b'], permitidos);
  assert.equal(itens.filter(i => i.funcionario_id === 'a').length, 2);
  assert.equal(itens.reduce((s, i) => s + i.quantidade, 0), 3);
});
test('destinação incompleta ou funcionário fora da lista impede salvar', () => {
  for (const ids of [['a', 'b'], ['a', 'b', ''], ['a', 'b', 'outra-obra']])
    assert.throws(() => distribuirItemEpi(item, ids, permitidos));
});
test('EPI não aceita quantidade fracionária, não finita ou negativa', () => {
  for (const quantidade of [0, -1, 1.5, Infinity, NaN, 1001])
    assert.throws(() => distribuirItemEpi({ ...item, quantidade }, ['a'], permitidos));
});
test('aumento mantém nomes; redução preserva apenas posições mantidas; campo vazio não apaga nomes', () => {
  assert.deepEqual(redimensionarDestinacoes(['a', 'b'], 3), ['a', 'b', '']);
  assert.deepEqual(redimensionarDestinacoes(['a', 'b', 'c'], 2), ['a', 'b']);
  assert.deepEqual(redimensionarDestinacoes(['a', 'b'], 0), ['a', 'b']);
});
