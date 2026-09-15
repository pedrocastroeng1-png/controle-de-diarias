import test from 'node:test';
import assert from 'node:assert/strict';
import { criarPlanilhaGerencial } from '../src/lib/excel/geradorPlanilhaMateriais.ts';

test('Excel conserva obra e funcionário por EPI e não cria obra fictícia', async () => {
  const base = {data_compra:'2026-09-15',material:'Luva',categoria:'EPI',unidade:'PAR',quantidade:1,valor_unitario:10,valor_total:10,fornecedor:'Fornecedor',numero_recibo:'123'};
  const workbook = criarPlanilhaGerencial([
    {...base,obra:'Obra A',funcionario_destinatario:'Antônio'},
    {...base,obra:'Obra A',funcionario_destinatario:'José'},
    {...base,obra:'Obra B',funcionario_destinatario:'Carlos'},
  ]);
  for (const name of ['ENTRADAS','POR OBRA']) {
    const sheet=workbook.getWorksheet(name)!;
    assert.deepEqual([2,3,4].map(r=>sheet.getCell(`B${r}`).value),['Obra A','Obra A','Obra B']);
    assert.deepEqual([2,3,4].map(r=>sheet.getCell(`J${r}`).value),['Antônio','José','Carlos']);
    assert.equal(sheet.getCell('K2').value,'123');
    assert.deepEqual(sheet.getCell('I4').value,{formula:'F4*H4'});
  }
  assert.equal(workbook.getWorksheet('PAINEL')!.getCell('H6').value,2);
  assert.ok((await workbook.xlsx.writeBuffer()).byteLength>0);
});
