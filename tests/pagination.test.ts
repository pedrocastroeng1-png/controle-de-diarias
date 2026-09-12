import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectPages } from '../src/lib/pagination';

test('recupera 1065 linhas sem truncar no limite de 1000', async () => {
  const source = Array.from({ length: 1065 }, (_, id) => ({ id }));
  const result = await collectPages((from, to) => Promise.resolve({ data: source.slice(from, to + 1), error: null, count: source.length }));
  assert.deepEqual(result, source);
});
test('respeita teto de servidor menor que o tamanho da página', async () => {
  const source = Array.from({ length: 39 }, (_, id) => id);
  const result = await collectPages(from => Promise.resolve({ data: source.slice(from, from + 10), error: null, count: source.length }));
  assert.deepEqual(result, source);
});
test('lista vazia é válida', async () => {
  assert.deepEqual(await collectPages(() => Promise.resolve({ data: [], error: null, count: 0 })), []);
});
test('erro em página posterior não entrega resultado parcial como sucesso', async () => {
  await assert.rejects(collectPages(from => Promise.resolve(from ? { data: null, error: new Error('offline') } : { data: [1], error: null, count: 2 })), /offline/);
});
test('mudança de contagem entre páginas exige nova consulta', async () => {
  await assert.rejects(collectPages(from => Promise.resolve({ data: [from], error: null, count: from ? 3 : 2 })), /mudaram/);
});
test('detecta resposta incompleta', async () => {
  await assert.rejects(collectPages(() => Promise.resolve({ data: [], error: null, count: 1 })), /incompleta/);
});
test('sem count continua até receber página vazia', async () => {
  assert.deepEqual(await collectPages(from => Promise.resolve({ data: from < 3 ? [from] : [], error: null })), [0, 1, 2]);
});
