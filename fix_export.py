import re

with open('/tmp/Relatorios.tsx', 'r') as f:
    content = f.read()

# We want to replace everything from "const handleExportExcel = async () => {"
# to the end of the function.
# Let's find the function.

start_idx = content.find("const handleExportExcel = async () => {")
end_idx = content.find("const handleExportPagamentosCaixa = () => {")

old_func = content[start_idx:end_idx]

new_func = """const handleExportExcel = async () => {
    try {
      const obraNome = obras.find(o => o.id === obraId)?.nome || 'Todas as Obras';
      const periodStr = dataInicial && dataFinal 
        ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} até ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
        : 'Todos os períodos';

      // Fetch from new views
      const obraSelecionada = obras.find(o => o.id === obraId)?.nome || '';
      const folhaData = await api.getFolhaDiarias(dataInicial, dataFinal, obraSelecionada);
      const cltData = await api.getRelatorioCLT(dataInicial, dataFinal, obraSelecionada);

      // Group DIARISTAS
      const diaristasMap: Record<string, any> = {};
      folhaData.forEach((p: any) => {
        const fId = p.funcionario_id || p.funcionario;
        if (!fId) return;
        if (!diaristasMap[fId]) {
          diaristasMap[fId] = {
            id: fId,
            nome: p.funcionario || '',
            funcao: p.funcao || '',
            obra: p.obra || '',
            dias: 0,
            valorDiaria: Number(p.valor_diaria) || 0,
            total: 0
          };
        }
        let rowValor = Number(p.valor_calculado) || Number(p.valor_diaria) || 0;
        if (p.status === 'PRESENTE' || p.status === 'ATESTADO MÉDICO' || p.status === 'MEIA_DIARIA' || p.tipo_diaria === 'MEIA_DIARIA' || p.status === 'MEIA DIÁRIA') {
          diaristasMap[fId].dias += 1;
          diaristasMap[fId].total += rowValor;
        }
      });
      const diaristasAgrupado = Object.values(diaristasMap).sort((a, b) => a.nome.localeCompare(b.nome));
      const valorTotal = diaristasAgrupado.reduce((acc, curr) => acc + curr.total, 0);
      const totaisDias = diaristasAgrupado.reduce((acc, curr) => acc + curr.dias, 0);

      const workbook = new ExcelJS.Workbook();
      
      // 1. _BD Worksheet (Hidden) - ONLY DIARISTAS
      const wsBD = workbook.addWorksheet('_BD', { state: 'hidden' });
      wsBD.columns = [
        { header: 'HelperID', key: 'helper', width: 20 },
        { header: 'Funcionário', key: 'funcionario', width: 30 },
        { header: 'Função', key: 'funcao', width: 20 },
        { header: 'Obra', key: 'obra', width: 20 },
        { header: 'Data', key: 'data', width: 15 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Tipo da Diária', key: 'tipo_diaria', width: 15 },
        { header: 'Percentual', key: 'percentual', width: 15 },
        { header: 'Valor da Diária', key: 'valor_base', width: 15 },
        { header: 'Valor Calculado', key: 'valor', width: 15 }
      ];

      const folhaOrdenada = [...folhaData].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      folhaOrdenada.forEach((p) => {
        let pStatus = '✘ Faltou';
        if (p.status === 'ATESTADO MÉDICO') pStatus = '🩺 Atestado Médico';
        else if (p.status === 'PRESENTE' && p.tipo_diaria === 'MEIA_DIARIA') pStatus = '🌗 Meia Diária';
        else if (p.status === 'MEIA DIÁRIA') pStatus = '🌗 Meia Diária';
        else if (p.status === 'PRESENTE') pStatus = '✔ Presente';
        
        wsBD.addRow({
          helper: '', 
          funcionario: p.funcionario || '',
          funcao: p.funcao || '',
          obra: p.obra || '',
          data: p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '',
          status: pStatus,
          tipo_diaria: p.tipo_diaria === 'MEIA_DIARIA' ? 'Meia Diária' : 'Diária',
          percentual: (p.percentual_diaria || (p.tipo_diaria === 'MEIA_DIARIA' ? 50 : 100)) + '%',
          valor_base: Number(p.valor_diaria) || 0,
          valor: Number(p.valor_calculado) || Number(p.valor_diaria) || 0
        });
      });
      
      wsBD.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.getCell('A').value = { formula: `B${rowNumber}&COUNTIF($B$2:B${rowNumber},B${rowNumber})`, result: '' };
        }
      });

      const sortedFuncs = diaristasAgrupado.map(f => f.nome);
      wsBD.getCell('J1').value = 'UniqueNames';
      sortedFuncs.forEach((name, idx) => {
        wsBD.getCell(`J${idx + 2}`).value = name;
      });

      // 2. TOTAL DIARIAS Worksheet (was Resumo)
      const wsResumo = workbook.addWorksheet('TOTAL DIARIAS');
      
      wsResumo.mergeCells('A1:F1');
      const cellA1 = wsResumo.getCell('A1');
      cellA1.value = `${empresa?.nome || "PCEG"} - GESTÃO DE OBRAS`;
      cellA1.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cellA1.alignment = { vertical: 'middle', horizontal: 'center' };
      
      wsResumo.mergeCells('A2:F2');
      const cellA2 = wsResumo.getCell('A2');
      cellA2.value = `${empresa?.nome || "PCEG"} - GESTÃO DE OBRAS`;
      cellA2.font = { size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
      cellA2.alignment = { vertical: 'middle', horizontal: 'center' };

      wsResumo.mergeCells('A3:F3');
      const cellA3 = wsResumo.getCell('A3');
      cellA3.value = `Período: ${periodStr}`;
      cellA3.font = { size: 12, italic: true };
      cellA3.alignment = { vertical: 'middle', horizontal: 'center' };

      if (obraId) {
        wsResumo.mergeCells('A4:F4');
        const cellA4 = wsResumo.getCell('A4');
        cellA4.value = `Obra: ${obraNome}`;
        cellA4.font = { size: 12, italic: true };
        cellA4.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      wsResumo.mergeCells('B6:C6');
      wsResumo.getCell('B6').value = 'Quantidade de Funcionários';
      wsResumo.mergeCells('B7:C7');
      wsResumo.getCell('B7').value = diaristasAgrupado.length;
      
      wsResumo.getCell('D6').value = 'Total de Diárias';
      wsResumo.getCell('D7').value = totaisDias;

      wsResumo.mergeCells('E6:F6');
      wsResumo.getCell('E6').value = 'Valor Total da Folha';
      wsResumo.mergeCells('E7:F7');
      wsResumo.getCell('E7').value = valorTotal;
      wsResumo.getCell('E7').numFmt = '"R$" #,##0.00';

      ['B6','D6','E6'].forEach(col => {
        const cell = wsResumo.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
      });

      ['B7','D7','E7'].forEach(col => {
        const cell = wsResumo.getCell(col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        cell.font = { size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } }, left: { style: 'thin', color: { argb: 'FFD1D5DB' } }, right: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
      });

      const startRow = 10;
      wsResumo.getRow(startRow).values = ['Funcionário', 'Função', 'Obra', 'Valor da Diária', 'Dias Trabalhados', 'Total Recebido'];
      wsResumo.getRow(startRow).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      wsResumo.getRow(startRow).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      
      wsResumo.columns = [
        { key: 'funcionario', width: 35 },
        { key: 'funcao', width: 25 },
        { key: 'obra', width: 25 },
        { key: 'valor', width: 20 },
        { key: 'dias', width: 20 },
        { key: 'total', width: 20 }
      ];

      diaristasAgrupado.forEach((f, index) => {
        const row = wsResumo.addRow([
          f.nome,
          f.funcao,
          f.obra,
          f.valorDiaria,
          f.dias,
          f.total
        ]);
        row.getCell(4).numFmt = '"R$" #,##0.00';
        row.getCell(6).numFmt = '"R$" #,##0.00';
        
        if (index % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }
        
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });

      wsResumo.autoFilter = `A${startRow}:F${startRow + diaristasAgrupado.length}`;
      wsResumo.views = [{ state: 'frozen', ySplit: startRow }];

      const summaryRowStart = startRow + diaristasAgrupado.length + 2;
      wsResumo.getCell(`A${summaryRowStart}`).value = 'Quantidade de Funcionários';
      wsResumo.getCell(`B${summaryRowStart}`).value = diaristasAgrupado.length;
      wsResumo.getCell(`A${summaryRowStart + 1}`).value = 'Total de Diárias';
      wsResumo.getCell(`B${summaryRowStart + 1}`).value = totaisDias;
      wsResumo.getCell(`A${summaryRowStart + 2}`).value = 'Valor Total da Folha';
      wsResumo.getCell(`B${summaryRowStart + 2}`).value = valorTotal;
      wsResumo.getCell(`B${summaryRowStart + 2}`).numFmt = '"R$" #,##0.00';
      
      for(let i=0; i<3; i++) {
        wsResumo.getCell(`A${summaryRowStart+i}`).font = { bold: true };
        wsResumo.getCell(`B${summaryRowStart+i}`).font = { bold: true };
        wsResumo.getCell(`A${summaryRowStart+i}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        wsResumo.getCell(`B${summaryRowStart+i}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
      }

      // 3. DIARISTAS Worksheet (was Funcionário)
      const wsFunc = workbook.addWorksheet('DIARISTAS');
      wsFunc.columns = [
        { width: 5 },
        { width: 25 },
        { width: 25 },
        { width: 35 },
        { width: 20 },
        { width: 20 }
      ];

      wsFunc.mergeCells('B2:E2');
      const cellFuncH = wsFunc.getCell('B2');
      cellFuncH.value = 'CONSULTA DE FUNCIONÁRIO';
      cellFuncH.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      cellFuncH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cellFuncH.alignment = { vertical: 'middle', horizontal: 'center' };

      wsFunc.getCell('B4').value = 'Funcionário:';
      wsFunc.getCell('B4').font = { bold: true, size: 12 };
      
      const funcCell = wsFunc.getCell('C4');
      const lastRow = sortedFuncs.length + 1;
      funcCell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`_BD!$J$2:$J${lastRow > 1 ? lastRow : 2}`]
      };
      funcCell.value = sortedFuncs[0] || '';
      funcCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
      funcCell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      funcCell.font = { bold: true, size: 12 };

      wsFunc.getCell('B6').value = 'Nome:';
      wsFunc.getCell('C6').value = { formula: 'C4', result: '' };
      wsFunc.getCell('B7').value = 'Função:';
      wsFunc.getCell('C7').value = { formula: `IFERROR(VLOOKUP(C4, 'TOTAL DIARIAS'!A:F, 2, FALSE), "")`, result: '' };
      wsFunc.getCell('B8').value = 'Obra:';
      wsFunc.getCell('C8').value = { formula: `IFERROR(VLOOKUP(C4, 'TOTAL DIARIAS'!A:F, 3, FALSE), "")`, result: '' };

      wsFunc.getCell('B10').value = 'Valor da Diária';
      wsFunc.getCell('B11').value = { formula: `IFERROR(VLOOKUP(C4, 'TOTAL DIARIAS'!A:F, 4, FALSE), 0)`, result: 0 };
      wsFunc.getCell('B11').numFmt = '"R$" #,##0.00';
      wsFunc.getCell('C10').value = 'Dias Trabalhados';
      wsFunc.getCell('C11').value = { formula: `IFERROR(VLOOKUP(C4, 'TOTAL DIARIAS'!A:F, 5, FALSE), 0)`, result: 0 };
      wsFunc.getCell('D10').value = 'Valor Total Recebido';
      wsFunc.getCell('D11').value = { formula: `IFERROR(VLOOKUP(C4, 'TOTAL DIARIAS'!A:F, 6, FALSE), 0)`, result: 0 };
      wsFunc.getCell('D11').numFmt = '"R$" #,##0.00';

      ['B10', 'C10', 'D10'].forEach(col => {
        const c = wsFunc.getCell(col);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.alignment = { horizontal: 'center' };
        c.border = { top: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
      });
      ['B11', 'C11', 'D11'].forEach(col => {
        const c = wsFunc.getCell(col);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
        c.font = { bold: true, size: 14 };
        c.alignment = { horizontal: 'center' };
        c.border = { bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
      });
      
      ['B6','B7','B8'].forEach(col => { wsFunc.getCell(col).font = { bold: true }; });

      wsFunc.mergeCells('B14:D14');
      const histHeader = wsFunc.getCell('B14');
      histHeader.value = 'HISTÓRICO DE PRESENÇAS';
      histHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      histHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
      histHeader.alignment = { horizontal: 'center' };

      wsFunc.getCell('B15').value = 'Data';
      wsFunc.getCell('C15').value = 'Status';
      wsFunc.getCell('B15').font = { bold: true };
      wsFunc.getCell('C15').font = { bold: true };
      wsFunc.getCell('B15').border = { bottom: {style:'medium'} };
      wsFunc.getCell('C15').border = { bottom: {style:'medium'} };

      for(let i = 1; i <= 31; i++) {
        const rowNum = 15 + i;
        wsFunc.getCell(`B${rowNum}`).value = { formula: `IFERROR(INDEX(_BD!E:E, MATCH($C$4 & ${i}, _BD!A:A, 0)), "")`, result: '' };
        wsFunc.getCell(`C${rowNum}`).value = { formula: `IFERROR(INDEX(_BD!F:F, MATCH($C$4 & ${i}, _BD!A:A, 0)), "")`, result: '' };
      }

      // 4. FUNCIONARIO CLT Worksheet
      const wsCLT = workbook.addWorksheet('FUNCIONARIO CLT');
      
      wsCLT.mergeCells('A1:J1');
      const cellCLT1 = wsCLT.getCell('A1');
      cellCLT1.value = `${empresa?.nome || "PCEG"} - RELATÓRIO DE FREQUÊNCIA CLT`;
      cellCLT1.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      cellCLT1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cellCLT1.alignment = { vertical: 'middle', horizontal: 'center' };
      
      wsCLT.mergeCells('A2:J2');
      const cellCLT2 = wsCLT.getCell('A2');
      cellCLT2.value = `Período: ${periodStr} ${obraId ? '| Obra: ' + obraNome : ''}`;
      cellCLT2.font = { size: 12, italic: true };
      cellCLT2.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Calculate distinct dates for columns (Monday to Friday only)
      const dateSet = new Set<string>();
      cltData.forEach((row: any) => {
        if (row.data) {
          const d = parseISO(row.data);
          const day = d.getDay(); // 0 is Sunday, 6 is Saturday
          if (day !== 0 && day !== 6) {
            dateSet.add(row.data);
          }
        }
      });
      const distinctDates = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      const cltColumns: any[] = [
        { header: 'Funcionário', key: 'funcionario', width: 35 },
        { header: 'Função', key: 'funcao', width: 25 },
        { header: 'Obra Principal', key: 'obra_principal', width: 25 },
        { header: 'Sub-obra', key: 'subobra', width: 25 },
      ];
      
      distinctDates.forEach(dateStr => {
        const d = parseISO(dateStr);
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
        cltColumns.push({ 
          header: `${dayName} - ${format(d, 'dd/MM')}`, 
          key: `date_${dateStr}`, 
          width: 20 
        });
      });
      
      wsCLT.columns = cltColumns;
      const cltHeaderRow = wsCLT.getRow(4);
      cltHeaderRow.values = cltColumns.map(c => c.header);
      cltHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cltHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } };
      
      // Group CLT data by employee
      const cltAgrupado: Record<string, any> = {};
      cltData.forEach((row: any) => {
        const d = parseISO(row.data);
        const day = d.getDay();
        if (day === 0 || day === 6) return; // Skip weekends
        
        const fId = row.funcionario_id || row.funcionario;
        if (!fId) return;
        
        if (!cltAgrupado[fId]) {
          cltAgrupado[fId] = {
            funcionario: row.funcionario || '',
            funcao: row.funcao || '',
            obra_principal: row.obra_principal || row.obra || '',
            subobra: row.subobra || '',
            presencas: {}
          };
        }
        
        let pStatus = '✘ Faltou';
        if (row.status === 'ATESTADO MÉDICO') pStatus = '🩺 Atestado';
        else if (row.status === 'PRESENTE') pStatus = '✔ Presente';
        else if (row.status === 'MEIA DIÁRIA' || row.status === 'MEIA_DIARIA') pStatus = '🌗 Meio Período';
        
        cltAgrupado[fId].presencas[row.data] = pStatus;
      });
      
      const cltSorted = Object.values(cltAgrupado).sort((a, b) => a.funcionario.localeCompare(b.funcionario));
      
      cltSorted.forEach((f, idx) => {
        const rowData: any = {
          funcionario: f.funcionario,
          funcao: f.funcao,
          obra_principal: f.obra_principal,
          subobra: f.subobra
        };
        
        distinctDates.forEach(dateStr => {
          rowData[`date_${dateStr}`] = f.presencas[dateStr] || '-';
        });
        
        const row = wsCLT.addRow(rowData);
        if (idx % 2 === 1) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        }
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });
      
      wsCLT.autoFilter = `A4:${String.fromCharCode(65 + cltColumns.length - 1)}4`;
      wsCLT.views = [{ state: 'frozen', ySplit: 4 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Relatorio_Obras_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
    } catch (e) {
      console.error(e);
      setErro('Ocorreu um erro ao exportar o Excel.');
    }
  };
"""

content = content[:start_idx] + new_func + content[end_idx:]

with open('/tmp/Relatorios2.tsx', 'w') as f:
    f.write(content)
