import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { criarZipFuncionarios, criarFichaFuncionario, resumirFuncionario, nomeArquivoFuncionario, dataFicha } from '../src/lib/funcionarios-zip';
import type { Funcionario } from '../src/lib/types';
import type { RegistroRelatorio } from '../src/lib/atestados-relatorio';
const f: Funcionario = { id: 'f1', empresa_id: 'e1', nome: 'João / Teste', funcao_id: 'j1', obra_id: 'o1', ativo: false, tipo_colaborador: 'DIARISTA', funcao: { id: 'j1', nome: 'Servente', valor_diaria: 80 } };
const row = (data: string, extra: Partial<RegistroRelatorio> = {}) => ({ funcionario_id: 'f1', empresa_id: 'e1', data, status: 'PRESENTE', tipo_colaborador: 'DIARISTA', valor_calculado: 80, percentual_diaria: 100, ...extra }) as RegistroRelatorio;
test('total do inativo soma integral, meia e atestado; não soma falta nem homônimo', () => {
  const result = resumirFuncionario(f, [row('2026-09-01'), row('2026-09-02', { percentual_diaria: 50, valor_calculado: 40 }), row('2026-09-03', { status: 'ATESTADO MÉDICO' }), row('2026-09-04', { status: 'FALTOU' }), row('2026-09-01', { funcionario_id: 'f2' })]);
  assert.deepEqual(result, { integrais: 1, meias: 1, atestados: 1, total: 200, inicio: '2026-09-01', fim: '2026-09-03' });
});
test('CLT não exibe total diário e zero não vira valor base', () => {
  assert.equal(resumirFuncionario({ ...f, tipo_colaborador: 'CLT' }, [row('2026-09-01')]).total, 0);
  assert.equal(resumirFuncionario(f, [row('2026-09-01', { valor_calculado: 0, valor_diaria: 80 })]).total, 0);
});
test('rejeita dias duplicados, empresa divergente e valor inválido', () => {
  assert.throws(() => resumirFuncionario(f, [row('2026-09-01'), row('2026-09-01')]));
  assert.throws(() => resumirFuncionario(f, [row('2026-09-01', { empresa_id: 'e2' })]));
  assert.throws(() => resumirFuncionario(f, [row('2026-09-01', { valor_calculado: NaN })]));
});
test('datas civis não deslocam dia; cadastro usa Maceió; ausentes não são inventadas', () => {
  assert.equal(dataFicha('2026-09-04'), '04/09/2026');
  assert.equal(dataFicha(null), 'Não informado');
  assert.match(dataFicha('2026-09-05T01:00:00Z', true), /04\/09\/2026/);
  assert.throws(() => dataFicha('2026-02-30'));
});
test('ZIP contém exatamente um PDF por selecionado, incluindo homônimos', async () => {
  const other = { ...f, id: 'f2' };
  const blob = await criarZipFuncionarios([f, other], [], async () => null);
  const zip = await JSZip.loadAsync(await blob.arrayBuffer(), { checkCRC32: true });
  assert.deepEqual(Object.keys(zip.files).sort(), [nomeArquivoFuncionario(f), nomeArquivoFuncionario(other)].sort());
  for (const file of Object.values(zip.files)) assert.match(await file.async('string'), /^%PDF-/);
  assert.ok(!nomeArquivoFuncionario(f).includes('/'));
});
test('ZIP falha sem seleção, com empresa mista, repetição ou foto cadastrada indisponível', async () => {
  await assert.rejects(criarZipFuncionarios([], [], async () => null));
  await assert.rejects(criarZipFuncionarios([f, f], [], async () => null));
  await assert.rejects(criarZipFuncionarios([f, { ...f, id: 'f2', empresa_id: 'e2' }], [], async () => null));
  await assert.rejects(criarZipFuncionarios([{ ...f, photo_path: 'photo.jpg' }], [], async () => null));
});
test('PDF aceita observação extensa sem falhar e gera documento válido', () => {
  const pdf = criarFichaFuncionario({ ...f, observacao_pagamento: 'Observação extensa de pagamento. '.repeat(150) }, resumirFuncionario(f, []), null);
  assert.match(Buffer.from(pdf).toString('latin1'), /^%PDF-/);
});
