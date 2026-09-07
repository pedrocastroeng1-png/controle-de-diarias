import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format, parseISO } from 'date-fns';

export async function gerarPlanilhaGerencial(compras: any[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Controle';
  workbook.created = new Date();

  // Cores profissionais (Engenharia/Construção)
  const primaryColor = '1E3A8A'; // Azul escuro
  const secondaryColor = 'F3F4F6'; // Cinza claro
  const white = 'FFFFFF';
  const black = '000000';
  
  // ==========================================
  // ABA 1: PAINEL
  // ==========================================
  const painel = workbook.addWorksheet('PAINEL', { views: [{ showGridLines: false }] });
  
  // Configurando larguras
  for(let i=1; i<=10; i++) {
    painel.getColumn(i).width = 22;
  }
  
  // Título
  painel.mergeCells('B2:H3');
  const titleCell = painel.getCell('B2');
  titleCell.value = 'CONTROLE GERENCIAL DE ENTRADA E DESTINAÇÃO DE MATERIAIS';
  titleCell.font = { size: 18, bold: true, color: { argb: white } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Cartões Superiores
  painel.getCell('B5').value = 'TOTAL COMPRADO';
  painel.getCell('B5').font = { bold: true, color: { argb: white } };
  painel.getCell('B5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  painel.getCell('B5').alignment = { horizontal: 'center' };
  painel.getCell('B6').value = { formula: 'SUM(ENTRADAS!I:I)' };
  painel.getCell('B6').numFmt = '"R$ "#,##0.00';
  painel.getCell('B6').font = { size: 14, bold: true };
  painel.getCell('B6').alignment = { horizontal: 'center' };
  
  painel.getCell('D5').value = 'TOTAL DE LANÇAMENTOS';
  painel.getCell('D5').font = { bold: true, color: { argb: white } };
  painel.getCell('D5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  painel.getCell('D5').alignment = { horizontal: 'center' };
  painel.getCell('D6').value = { formula: 'COUNTA(ENTRADAS!A:A)-1' };
  painel.getCell('D6').font = { size: 14, bold: true };
  painel.getCell('D6').alignment = { horizontal: 'center' };
  
  painel.getCell('F5').value = 'QTD TOTAL MATERIAIS';
  painel.getCell('F5').font = { bold: true, color: { argb: white } };
  painel.getCell('F5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  painel.getCell('F5').alignment = { horizontal: 'center' };
  painel.getCell('F6').value = { formula: 'SUM(ENTRADAS!F:F)' };
  painel.getCell('F6').font = { size: 14, bold: true };
  painel.getCell('F6').alignment = { horizontal: 'center' };
  
  const obrasUnicas = Array.from(new Set(compras.map(c => c.obra))).sort();
  const fornecedoresUnicos = Array.from(new Set(compras.map(c => c.fornecedor || 'N/A'))).sort();
  const materiaisUnicos = Array.from(new Set(compras.map(c => `${c.material}|${c.categoria}|${c.unidade}`))).sort();
  const categoriasUnicas = Array.from(new Set(compras.map(c => c.categoria))).sort();

  painel.getCell('H5').value = 'OBRAS ATENDIDAS';
  painel.getCell('H5').font = { bold: true, color: { argb: white } };
  painel.getCell('H5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  painel.getCell('H5').alignment = { horizontal: 'center' };
  painel.getCell('H6').value = obrasUnicas.length;
  painel.getCell('H6').font = { size: 14, bold: true };
  painel.getCell('H6').alignment = { horizontal: 'center' };
  
  painel.getCell('J5').value = 'FORNECEDORES';
  painel.getCell('J5').font = { bold: true, color: { argb: white } };
  painel.getCell('J5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  painel.getCell('J5').alignment = { horizontal: 'center' };
  painel.getCell('J6').value = fornecedoresUnicos.length;
  painel.getCell('J6').font = { size: 14, bold: true };
  painel.getCell('J6').alignment = { horizontal: 'center' };

  // Bordas pros cartões
  ['B5','B6','D5','D6','F5','F6','H5','H6','J5','J6'].forEach(cellRef => {
    painel.getCell(cellRef).border = {
      top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
    };
  });
  
  // Quadro: VALOR DE MATERIAIS POR OBRA
  painel.mergeCells('B9:C9');
  painel.getCell('B9').value = 'VALOR DE MATERIAIS POR OBRA';
  painel.getCell('B9').font = { bold: true, size: 12, color: { argb: primaryColor } };
  
  painel.getCell('B10').value = 'OBRA';
  painel.getCell('B10').font = { bold: true, color: { argb: white } };
  painel.getCell('B10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  painel.getCell('C10').value = 'VALOR TOTAL';
  painel.getCell('C10').font = { bold: true, color: { argb: white } };
  painel.getCell('C10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  
  let row = 11;
  obrasUnicas.forEach(obra => {
    painel.getCell(`B${row}`).value = obra;
    painel.getCell(`B${row}`).border = { top: {style:'thin', color:{argb:secondaryColor}}, bottom: {style:'thin', color:{argb:secondaryColor}} };
    
    painel.getCell(`C${row}`).value = { formula: `SUMIF(ENTRADAS!B:B, B${row}, ENTRADAS!I:I)` };
    painel.getCell(`C${row}`).numFmt = '"R$ "#,##0.00';
    painel.getCell(`C${row}`).border = { top: {style:'thin', color:{argb:secondaryColor}}, bottom: {style:'thin', color:{argb:secondaryColor}} };
    row++;
  });
  
  // Quadro: MATERIAIS DESTINADOS POR OBRA
  painel.mergeCells('E9:H9');
  painel.getCell('E9').value = 'MATERIAIS DESTINADOS POR OBRA';
  painel.getCell('E9').font = { bold: true, size: 12, color: { argb: primaryColor } };
  
  const headersE = ['OBRA', 'QTD LANÇAMENTOS', 'QUANTIDADE TOTAL', 'VALOR TOTAL'];
  headersE.forEach((h, i) => {
    const colStr = String.fromCharCode(69 + i); // E, F, G, H
    painel.getCell(`${colStr}10`).value = h;
    painel.getCell(`${colStr}10`).font = { bold: true, color: { argb: white } };
    painel.getCell(`${colStr}10`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  });
  
  let row2 = 11;
  obrasUnicas.forEach(obra => {
    painel.getCell(`E${row2}`).value = obra;
    painel.getCell(`F${row2}`).value = { formula: `COUNTIF(ENTRADAS!B:B, E${row2})` };
    painel.getCell(`G${row2}`).value = { formula: `SUMIF(ENTRADAS!B:B, E${row2}, ENTRADAS!F:F)` };
    painel.getCell(`H${row2}`).value = { formula: `SUMIF(ENTRADAS!B:B, E${row2}, ENTRADAS!I:I)` };
    painel.getCell(`H${row2}`).numFmt = '"R$ "#,##0.00';
    
    ['E','F','G','H'].forEach(col => {
      painel.getCell(`${col}${row2}`).border = { top: {style:'thin', color:{argb:secondaryColor}}, bottom: {style:'thin', color:{argb:secondaryColor}} };
    });
    row2++;
  });

  // ==========================================
  // ABA 2: ENTRADAS
  // ==========================================
  const entradas = workbook.addWorksheet('ENTRADAS');
  entradas.columns = [
    { header: 'DATA', key: 'data', width: 15 },
    { header: 'OBRA', key: 'obra', width: 35 },
    { header: 'FORNECEDOR', key: 'fornecedor', width: 30 },
    { header: 'MATERIAL', key: 'material', width: 30 },
    { header: 'CATEGORIA', key: 'categoria', width: 25 },
    { header: 'QUANTIDADE', key: 'qtd', width: 15 },
    { header: 'UNIDADE', key: 'unidade', width: 10 },
    { header: 'VALOR UNITÁRIO', key: 'vunit', width: 20 },
    { header: 'VALOR TOTAL', key: 'vtotal', width: 20 }
  ];
  
  entradas.getRow(1).font = { bold: true, color: { argb: white } };
  entradas.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  entradas.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  
  entradas.autoFilter = 'A1:I1';
  entradas.views = [{ state: 'frozen', ySplit: 1 }];

  compras.forEach((c, idx) => {
    const r = entradas.addRow({
      data: format(parseISO(c.data_compra), 'dd/MM/yyyy'),
      obra: c.obra,
      fornecedor: c.fornecedor || 'N/A',
      material: c.material,
      categoria: c.categoria,
      qtd: Number(c.quantidade),
      unidade: c.unidade,
      vunit: Number(c.valor_unitario),
    });
    const rowIndex = idx + 2;
    r.getCell('vtotal').value = { formula: `F${rowIndex}*H${rowIndex}` };
    r.getCell('vunit').numFmt = '"R$ "#,##0.00';
    r.getCell('vtotal').numFmt = '"R$ "#,##0.00';
    r.getCell('qtd').numFmt = '#,##0.00';
  });

  // ==========================================
  // ABA 3: RESUMO POR MATERIAL
  // ==========================================
  const resumoMat = workbook.addWorksheet('RESUMO POR MATERIAL');
  resumoMat.columns = [
    { header: 'MATERIAL', key: 'mat', width: 35 },
    { header: 'CATEGORIA', key: 'cat', width: 25 },
    { header: 'UNIDADE', key: 'un', width: 12 },
    { header: 'QUANTIDADE TOTAL COMPRADA', key: 'qtd', width: 30 },
    { header: 'VALOR TOTAL', key: 'vtotal', width: 25 }
  ];
  resumoMat.getRow(1).font = { bold: true, color: { argb: white } };
  resumoMat.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  resumoMat.autoFilter = 'A1:E1';
  resumoMat.views = [{ state: 'frozen', ySplit: 1 }];
  
  materiaisUnicos.forEach((mStr, idx) => {
    const [mat, cat, un] = mStr.split('|');
    const rowIndex = idx + 2;
    const r = resumoMat.addRow({ mat, cat, un });
    r.getCell('qtd').value = { formula: `SUMIF(ENTRADAS!D:D, A${rowIndex}, ENTRADAS!F:F)` };
    r.getCell('vtotal').value = { formula: `SUMIF(ENTRADAS!D:D, A${rowIndex}, ENTRADAS!I:I)` };
    r.getCell('qtd').numFmt = '#,##0.00';
    r.getCell('vtotal').numFmt = '"R$ "#,##0.00';
  });

  // ==========================================
  // ABA 4: POR OBRA
  // ==========================================
  const porObra = workbook.addWorksheet('POR OBRA');
  porObra.columns = entradas.columns;
  porObra.getRow(1).font = { bold: true, color: { argb: white } };
  porObra.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  porObra.autoFilter = 'A1:I1';
  porObra.views = [{ state: 'frozen', ySplit: 1 }];
  
  compras.forEach((c, idx) => {
    const r = porObra.addRow({
      data: format(parseISO(c.data_compra), 'dd/MM/yyyy'),
      obra: c.obra,
      fornecedor: c.fornecedor || 'N/A',
      material: c.material,
      categoria: c.categoria,
      qtd: Number(c.quantidade),
      unidade: c.unidade,
      vunit: Number(c.valor_unitario),
    });
    const rowIndex = idx + 2;
    r.getCell('vtotal').value = { formula: `F${rowIndex}*H${rowIndex}` };
    r.getCell('vunit').numFmt = '"R$ "#,##0.00';
    r.getCell('vtotal').numFmt = '"R$ "#,##0.00';
  });

  // ==========================================
  // ABA 5: POR CATEGORIA
  // ==========================================
  const porCategoria = workbook.addWorksheet('POR CATEGORIA');
  porCategoria.columns = [
    { header: 'CATEGORIA', key: 'cat', width: 35 },
    { header: 'QUANTIDADE', key: 'qtd', width: 20 },
    { header: 'VALOR TOTAL', key: 'vtotal', width: 25 },
    { header: 'PERCENTUAL DO TOTAL', key: 'perc', width: 25 }
  ];
  porCategoria.getRow(1).font = { bold: true, color: { argb: white } };
  porCategoria.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  
  categoriasUnicas.forEach((cat, idx) => {
    const rowIndex = idx + 2;
    const r = porCategoria.addRow({ cat });
    r.getCell('qtd').value = { formula: `SUMIF(ENTRADAS!E:E, A${rowIndex}, ENTRADAS!F:F)` };
    r.getCell('vtotal').value = { formula: `SUMIF(ENTRADAS!E:E, A${rowIndex}, ENTRADAS!I:I)` };
    r.getCell('vtotal').numFmt = '"R$ "#,##0.00';
    r.getCell('perc').value = { formula: `IF(PAINEL!B6>0, C${rowIndex}/PAINEL!B6, 0)` };
    r.getCell('perc').numFmt = '0.00%';
  });

  // ==========================================
  // ABA 6: RELATÓRIO
  // ==========================================
  const relatorio = workbook.addWorksheet('RELATÓRIO', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      margins: { left: 0.5, right: 0.5, top: 0.7, bottom: 0.7, header: 0.3, footer: 0.3 },
      printTitlesRow: '1:5'
    },
    views: [{ showGridLines: false }]
  });
  
  for(let i=1; i<=8; i++) {
    relatorio.getColumn(i).width = 15;
  }
  
  relatorio.mergeCells('A1:H2');
  const relTitle = relatorio.getCell('A1');
  relTitle.value = 'CONTROLE DE ENTRADA DE MATERIAIS\nRELATÓRIO GERENCIAL';
  relTitle.font = { size: 16, bold: true, color: { argb: white } };
  relTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  relTitle.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  
  relatorio.getCell('A4').value = 'DATA DA EMISSÃO:';
  relatorio.getCell('A4').font = { bold: true };
  relatorio.getCell('C4').value = format(new Date(), 'dd/MM/yyyy HH:mm');
  
  relatorio.getCell('A5').value = 'TOTAL DE COMPRAS:';
  relatorio.getCell('A5').font = { bold: true };
  relatorio.getCell('C5').value = { formula: 'PAINEL!B6' };
  relatorio.getCell('C5').numFmt = '"R$ "#,##0.00';
  
  relatorio.getCell('A6').value = 'LANÇAMENTOS:';
  relatorio.getCell('A6').font = { bold: true };
  relatorio.getCell('C6').value = { formula: 'PAINEL!D6' };
  
  relatorio.getCell('A7').value = 'TOTAL DE OBRAS:';
  relatorio.getCell('A7').font = { bold: true };
  relatorio.getCell('C7').value = { formula: 'PAINEL!H6' };
  
  // 1. RESUMO POR OBRA
  relatorio.getCell('A9').value = '1. RESUMO POR OBRA';
  relatorio.getCell('A9').font = { bold: true, size: 12, color: { argb: primaryColor } };
  
  relatorio.getCell('A10').value = 'OBRA';
  relatorio.getCell('A10').font = { bold: true, color: { argb: white } };
  relatorio.getCell('A10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  relatorio.mergeCells('A10:C10');
  
  relatorio.getCell('D10').value = 'VALOR TOTAL';
  relatorio.getCell('D10').font = { bold: true, color: { argb: white } };
  relatorio.getCell('D10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  
  let rRow = 11;
  obrasUnicas.forEach(obra => {
    relatorio.mergeCells(`A${rRow}:C${rRow}`);
    relatorio.getCell(`A${rRow}`).value = obra;
    relatorio.getCell(`D${rRow}`).value = { formula: `SUMIF(ENTRADAS!B:B, A${rRow}, ENTRADAS!I:I)` };
    relatorio.getCell(`D${rRow}`).numFmt = '"R$ "#,##0.00';
    relatorio.getCell(`A${rRow}`).border = { bottom: {style:'thin', color:{argb:secondaryColor}} };
    relatorio.getCell(`D${rRow}`).border = { bottom: {style:'thin', color:{argb:secondaryColor}} };
    rRow++;
  });
  
  rRow += 2;
  
  // 2. RESUMO POR CATEGORIA
  relatorio.getCell(`A${rRow}`).value = '2. RESUMO POR CATEGORIA';
  relatorio.getCell(`A${rRow}`).font = { bold: true, size: 12, color: { argb: primaryColor } };
  rRow++;
  
  relatorio.getCell(`A${rRow}`).value = 'CATEGORIA';
  relatorio.getCell(`A${rRow}`).font = { bold: true, color: { argb: white } };
  relatorio.getCell(`A${rRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  relatorio.mergeCells(`A${rRow}:C${rRow}`);
  
  relatorio.getCell(`D${rRow}`).value = 'VALOR TOTAL';
  relatorio.getCell(`D${rRow}`).font = { bold: true, color: { argb: white } };
  relatorio.getCell(`D${rRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  rRow++;
  
  categoriasUnicas.forEach(cat => {
    relatorio.mergeCells(`A${rRow}:C${rRow}`);
    relatorio.getCell(`A${rRow}`).value = cat;
    relatorio.getCell(`D${rRow}`).value = { formula: `SUMIF(ENTRADAS!E:E, A${rRow}, ENTRADAS!I:I)` };
    relatorio.getCell(`D${rRow}`).numFmt = '"R$ "#,##0.00';
    relatorio.getCell(`A${rRow}`).border = { bottom: {style:'thin', color:{argb:secondaryColor}} };
    relatorio.getCell(`D${rRow}`).border = { bottom: {style:'thin', color:{argb:secondaryColor}} };
    rRow++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Planilha_Gerencial_Entradas_${format(new Date(), 'ddMMyyyy')}.xlsx`);
}
