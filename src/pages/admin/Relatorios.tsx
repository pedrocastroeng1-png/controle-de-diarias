import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Obra, Presenca } from '../../lib/types';
import { format, parseISO } from 'date-fns';
import { FileDown, Printer, Search, Table as TableIcon, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '../../contexts/AuthContext';

export default function Relatorios() {
  const { usuario } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraId, setObraId] = useState('');
  
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  
  const [relatorio, setRelatorio] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [visaoDetalhada, setVisaoDetalhada] = useState(false);

  useEffect(() => {
    loadObras();
    loadRelatorio('', '', '');
  }, []);

  async function loadObras() {
    try {
      const data = await api.getObras();
      setObras(data);
    } catch (e) {
      setErro('Ocorreu um erro ao carregar as obras.');
    }
  }

  async function loadRelatorio(inicio: string, fim: string, obra: string) {
    setLoading(true);
    setErro('');
    let data: any[] = [];
    let atestados: any[] = [];
    let funcionarios: any[] = [];

    try {
      [data, funcionarios] = await Promise.all([
        api.getRelatorio(inicio, fim, obra),
        api.getFuncionarios('todos', true)
      ]);
      
      try {
        atestados = await api.getAtestados(); // Fetch all or we could create a date-filtered one
      } catch (err) {
        console.error("Erro ao carregar atestados", err);
      }
      
      const funcionariosMap = new Map(funcionarios.map(f => [f.id, f]));
      const atestadoRecords = [];
      
      // Parse atestados and create simulated records
      atestados.forEach(atestado => {
        const start = parseISO(atestado.start_date);
        const end = parseISO(atestado.end_date);
        let curr = start;
        
        while (curr <= end) {
          const dateStr = format(curr, 'yyyy-MM-dd');
          
          // Only include if it falls within the requested range
          if ((!inicio || dateStr >= inicio) && (!fim || dateStr <= fim)) {
            const func = funcionariosMap.get(atestado.employee_id);
            if (func) {
              // Check if obra matches
              if (!obra || func.obra?.nome === obra) {
                atestadoRecords.push({
                  id: `atestado-${atestado.id}-${dateStr}`,
                  data: dateStr,
                  status: 'ATESTADO MÉDICO',
                  funcionario: func.nome,
                  funcao: func.funcao?.nome || '',
                  valor_diaria: func.funcao?.valor_diaria || 0,
                  obra: func.obra?.nome || '',
                  atestado_original_id: atestado.id,
                  atestado_description: atestado.description,
                  atestado_photo_path: atestado.photo_path
                });
              }
            }
          }
          curr = new Date(curr.getTime() + 86400000); // add one day
        }
      });
      
      // Merge and sort
      const merged = [...data, ...atestadoRecords].sort((a, b) => {
        if (a.data > b.data) return -1;
        if (a.data < b.data) return 1;
        return a.funcionario.localeCompare(b.funcionario);
      });
      
      setRelatorio(merged);
    } catch (e) {
      setErro('Ocorreu um erro ao gerar o relatório.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const obraSelecionada = obras.find(o => o.id === obraId)?.nome || '';
    loadRelatorio(dataInicial, dataFinal, obraSelecionada);
  }

  const agruparPorFuncionario = () => {
    const agrupado: Record<string, { nome: string, funcao: string, obra: string, dias: number, faltas: number, valorDiaria: number, total: number }> = {};
    
    relatorio.forEach((p: any) => {
      const fId = p.funcionario_id || p.funcionario_nome || p.funcionario;
      if (fId) {
        if (!agrupado[fId]) {
          agrupado[fId] = {
            nome: p.funcionario_nome || p.funcionario || '',
            funcao: p.funcao_nome || p.funcao || '',
            obra: p.obra_nome || p.obra || '',
            dias: 0,
            faltas: 0,
            valorDiaria: Number(p.valor_diaria) || 0,
            total: 0
          };
        }
        
        // Use row's valor_calculado for the exact amount (fallback to valor_diaria if old record)
        const rowValor = Number(p.valor_calculado) || Number(p.valor_diaria) || 0;
        
        if (p.status === 'PRESENTE' || p.status === 'ATESTADO MÉDICO' || p.status === 'MEIA_DIARIA' || p.tipo_diaria === 'MEIA_DIARIA') {
          // If it's half day, we count as 1 presence but total will be 50%
          agrupado[fId].dias += 1;
          agrupado[fId].total += rowValor;
        } else if (p.status === 'FALTOU') {
          agrupado[fId].faltas += 1;
        }
      }
    });

    return Object.values(agrupado).sort((a, b) => a.nome.localeCompare(b.nome));
  };

  const relatorioAgrupado = agruparPorFuncionario().filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const valorTotal = relatorioAgrupado.reduce((acc, curr) => acc + curr.total, 0);
  const totaisDias = relatorioAgrupado.reduce((acc, curr) => acc + curr.dias, 0);

  const getFileNameBase = () => {
    const dInicial = dataInicial ? format(parseISO(dataInicial), 'dd-MM-yyyy') : '';
    const dFinal = dataFinal ? format(parseISO(dataFinal), 'dd-MM-yyyy') : '';
    const range = (dInicial && dFinal) ? `${dInicial}_ate_${dFinal}` : (dInicial || dFinal || format(new Date(), 'dd-MM-yyyy'));
    let base = 'controle_diarias_';
    if (obraId) {
      const obra = obras.find(o => o.id === obraId);
      if (obra) {
        const cleanObraName = obra.nome.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_');
        base += `${cleanObraName}_`;
      }
    }
    return base + range;
  };

  const handleExportPDF = () => {
    try {
    console.log('[PDF] Iniciando geração');
    const doc = new jsPDF();
    const obraNome = obras.find(o => o.id === obraId)?.nome || 'Todas';
    const periodStr = dataInicial && dataFinal 
      ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
      : 'Todos os períodos';
    
    console.log('[PDF] Dataset recebido');
    const agrupado = relatorioAgrupado;
    const totalFolha = valorTotal;
    const totalDiarias = totaisDias;
    const totalFuncionarios = agrupado.length;
    console.log(`[PDF] Quantidade de registros: ${totalFuncionarios}`);

    console.log('[PDF] Preparando documento');
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('TARGOS ENGENHARIA', 14, 22);

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text('CONTROLE DE DIÁRIAS', 14, 32);
    
    doc.setFontSize(11);
    doc.text(`Obra: ${obraNome}`, 14, 42);
    doc.text(`Período: ${periodStr}`, 14, 48);

    console.log('[PDF] Gerando tabela');
    const tableColumn = ["Funcionário", "Função", "Obra", "Valor da Diária", "Dias Trabalhados", "Total Recebido"];
    const tableRows = agrupado.map(f => [
      f.nome,
      f.funcao,
      f.obra,
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.valorDiaria),
      f.dias.toString(),
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.total)
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'striped',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    console.log('[PDF] Finalizando documento');
    const finalY = (doc as any).lastAutoTable.finalY || 55;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Quantidade de Funcionários: ${totalFuncionarios}`, 14, finalY + 10);
    doc.text(`Total de Diárias: ${totalDiarias}`, 14, finalY + 16);
    doc.text(`Valor Total da Folha: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFolha)}`, 14, finalY + 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, finalY + 32);

    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
    }

    console.log('[PDF] Criando Blob/download');
    doc.save(`${getFileNameBase()}.pdf`);
    console.log('[PDF] PDF gerado com sucesso');
    } catch (e: any) {
      console.error('[PDF] ERRO COMPLETO:', e);
      console.error('[PDF] message:', e instanceof Error ? e.message : e);
      console.error('[PDF] stack:', e instanceof Error ? e.stack : undefined);
      setErro('Ocorreu um erro ao gerar o PDF.');
    }
  };

  const handleExportDailyPDF = async () => {
    const targetDate = dataInicial || hoje;
    const dailyData = relatorio;

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text('TARGOS ENGENHARIA', 14, 22);

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text('CONTROLE DE PRESENÇA', 14, 32);
    
    doc.setFontSize(11);
    doc.text(`Data: ${format(parseISO(targetDate), 'dd/MM/yyyy')}`, 14, 42);

    // Group by obra
    const obrasGroup: Record<string, any[]> = {};
    let totalPresentes = 0;
    let totalFaltas = 0;

    dailyData.forEach(p => {
      const obraName = p.obra_nome || p.obra || 'Sem Obra';
      if (!obrasGroup[obraName]) obrasGroup[obraName] = [];
      obrasGroup[obraName].push(p);
      
      if (p.status === 'PRESENTE' && p.tipo_diaria === 'MEIA_DIARIA') totalPresentes += 0.5;
      else if (p.status === 'PRESENTE') totalPresentes += 1;
      else if (p.status === 'MEIA DIÁRIA') totalPresentes += 0.5;
      else if (p.status === 'FALTOU') totalFaltas++;
    });

    let currentY = 55;

    Object.keys(obrasGroup).sort().forEach(obraName => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Obra: ${obraName}`, 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const funcs = obrasGroup[obraName].sort((a, b) => (a.funcionario_nome || a.funcionario || '').localeCompare(b.funcionario_nome || b.funcionario || ''));
      funcs.forEach(f => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
        let marker = ' F ';
        if (f.status === 'ATESTADO MÉDICO') marker = '🩺 Atestado';
        else if (f.status === 'PRESENTE' && f.tipo_diaria === 'MEIA_DIARIA') marker = '🌗 Meia Diária';
        else if (f.status === 'MEIA DIÁRIA') marker = '🌗 Meia Diária';
        else if (f.status === 'PRESENTE') marker = ' P ';
        
        doc.text(`[${marker}] ${f.funcionario_nome || f.funcionario}`, 14, currentY);
        currentY += 7;
      });
      currentY += 5;
    });

    currentY += 5;
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Total de Funcionários: ${dailyData.length}`, 14, currentY);
    doc.text(`Presentes (Diárias): ${totalPresentes}`, 14, currentY + 7);
    doc.text(`Faltas: ${totalFaltas}`, 14, currentY + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Operador Responsável: ${usuario?.usuario || 'Sistema'}`, 14, currentY + 28);
    doc.text(`Emitido em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, currentY + 35);

    const baseName = obraId ? obras.find(o => o.id === obraId)?.nome?.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_') + '_' : '';
    doc.save(`relatorio_diario_${baseName}${format(parseISO(targetDate), 'dd-MM-yyyy')}.pdf`);
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      const obraNome = obras.find(o => o.id === obraId)?.nome || 'Todas as Obras';
      const periodStr = dataInicial && dataFinal 
        ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} até ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
        : 'Todos os períodos';

      // 1. _BD Worksheet (Hidden)
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

      const relatorioOrdenado = [...relatorio].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      
      relatorioOrdenado.forEach((p) => {
        const funcName = p.funcionario_nome || p.funcionario || '';
        let pStatus = '✘ Faltou';
        if (p.status === 'ATESTADO MÉDICO') pStatus = '🩺 Atestado Médico';
        else if (p.status === 'PRESENTE' && p.tipo_diaria === 'MEIA_DIARIA') pStatus = '🌗 Meia Diária';
        else if (p.status === 'MEIA DIÁRIA') pStatus = '🌗 Meia Diária';
        else if (p.status === 'PRESENTE') pStatus = '✔ Presente';
        
        wsBD.addRow({
          helper: '', 
          funcionario: funcName,
          funcao: p.funcao || '',
          obra: p.obra_nome || p.obra || '',
          data: p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : '',
          status: pStatus,
          tipo_diaria: p.tipo_diaria === 'MEIA_DIARIA' ? 'Meia Diária' : 'Diária',
          percentual: (p.percentual_diaria || (p.tipo_diaria === 'MEIA_DIARIA' ? 50 : 100)) + '%',
          valor_base: Number(p.valor_diaria) || Number(p.valorDiaria) || 0,
          valor: Number(p.valor_calculado) || Number(p.valor_diaria) || Number(p.valorDiaria) || 0
        });
      });
      
      wsBD.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.getCell('A').value = { formula: `B${rowNumber}&COUNTIF($B$2:B${rowNumber},B${rowNumber})`, result: '' };
        }
      });

      const sortedFuncs = relatorioAgrupado.map(f => f.nome).sort();
      wsBD.getCell('J1').value = 'UniqueNames';
      sortedFuncs.forEach((name, idx) => {
        wsBD.getCell(`J${idx + 2}`).value = name;
      });

      // 2. Resumo Worksheet
      const wsResumo = workbook.addWorksheet('Resumo');
      
      wsResumo.mergeCells('A1:F1');
      const cellA1 = wsResumo.getCell('A1');
      cellA1.value = 'TARGOS ENGENHARIA';
      cellA1.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
      cellA1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cellA1.alignment = { vertical: 'middle', horizontal: 'center' };
      
      wsResumo.mergeCells('A2:F2');
      const cellA2 = wsResumo.getCell('A2');
      cellA2.value = 'CONTROLE DE DIÁRIAS';
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
      wsResumo.getCell('B7').value = relatorioAgrupado.length;
      
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

      relatorioAgrupado.forEach((f, index) => {
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

      wsResumo.autoFilter = `A${startRow}:F${startRow + relatorioAgrupado.length}`;
      wsResumo.views = [{ state: 'frozen', ySplit: startRow }];

      const summaryRowStart = startRow + relatorioAgrupado.length + 2;
      wsResumo.getCell(`A${summaryRowStart}`).value = 'Quantidade de Funcionários';
      wsResumo.getCell(`B${summaryRowStart}`).value = relatorioAgrupado.length;
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

      // 3. Funcionário Worksheet
      const wsFunc = workbook.addWorksheet('Funcionário');
      wsFunc.columns = [
        { width: 5 },
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
      wsFunc.getCell('C7').value = { formula: `IFERROR(VLOOKUP(C4, Resumo!A:F, 2, FALSE), "")`, result: '' };

      wsFunc.getCell('B8').value = 'Obra:';
      wsFunc.getCell('C8').value = { formula: `IFERROR(VLOOKUP(C4, Resumo!A:F, 3, FALSE), "")`, result: '' };

      wsFunc.getCell('B10').value = 'Valor da Diária';
      wsFunc.getCell('B11').value = { formula: `IFERROR(VLOOKUP(C4, Resumo!A:F, 4, FALSE), 0)`, result: 0 };
      wsFunc.getCell('B11').numFmt = '"R$" #,##0.00';

      wsFunc.getCell('C10').value = 'Dias Trabalhados';
      wsFunc.getCell('C11').value = { formula: `IFERROR(VLOOKUP(C4, Resumo!A:F, 5, FALSE), 0)`, result: 0 };

      wsFunc.getCell('D10').value = 'Valor Total Recebido';
      wsFunc.getCell('D11').value = { formula: `IFERROR(VLOOKUP(C4, Resumo!A:F, 6, FALSE), 0)`, result: 0 };
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
        wsFunc.getCell(`B${rowNum}`).value = { formula: `IFERROR(INDEX(_BD!F:F, MATCH($C$4 & ${i}, _BD!A:A, 0)), "")`, result: '' };
        wsFunc.getCell(`C${rowNum}`).value = { formula: `IFERROR(INDEX(_BD!G:G, MATCH($C$4 & ${i}, _BD!A:A, 0)), "")`, result: '' };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${getFileNameBase()}.xlsx`);
    } catch (e) {
      setErro('Ocorreu um erro ao exportar o Excel.');
    }
  };
const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Pesquisar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-8 print:hidden">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="obra" className="block text-sm font-medium text-gray-700 mb-1">
              Obra
            </label>
            <select
              id="obra"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todas as Obras</option>
              {obras.map(o => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dataInicial" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              id="dataInicial"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="dataFinal" className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              id="dataFinal"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="md:col-span-4 flex justify-end gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors h-[42px] disabled:opacity-70"
            >
              <Search className="h-4 w-4 mr-2" /> 
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
              <h3 className="text-lg font-medium text-gray-900">Resultado do Relatório</h3>
              <p className="text-sm text-gray-500">
                Resumo de folha de pagamento para o período selecionado.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setVisaoDetalhada(!visaoDetalhada)}
                className={`flex items-center px-4 py-2 border rounded-lg shadow-sm text-sm font-medium focus:outline-none transition-colors ${
                  visaoDetalhada 
                    ? 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100' 
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                <TableIcon className="h-4 w-4 mr-2" /> 
                {visaoDetalhada ? 'Visão Agrupada' : 'Visão Detalhada'}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </button>
              <button
                type="button"
                onClick={handleExportDailyPDF}
                className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" /> Relatório Diário
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors"
              >
                <TableIcon className="h-4 w-4 mr-2" /> Exportar Excel
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <FileDown className="h-4 w-4 mr-2" /> Gerar PDF
              </button>
            </div>
          </div>

          <div className="hidden print:block p-8">
            <h1 className="text-2xl font-bold mb-2">Controle de Diárias</h1>
            <p className="text-sm mb-1"><strong>Obra:</strong> {obras.find(o => o.id === obraId)?.nome || 'Todas as Obras'}</p>
            <p className="text-sm mb-6">
              <strong>Período:</strong>{' '}
              {dataInicial && dataFinal 
                ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
                : 'Todos os períodos'}
            </p>
          </div>

            {erro && (<div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{erro}</div>)}
            
        <div className="overflow-x-auto">
            {visaoDetalhada ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Obra</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo da Diária</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Percentual</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor da Diária</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Calculado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorio.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                        Nenhum registro encontrado para este período.
                      </td>
                    </tr>
                  ) : [...relatorio].sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime() || (a.funcionario_nome || a.funcionario || '').localeCompare(b.funcionario_nome || b.funcionario || '')).filter(p => (p.funcionario_nome || p.funcionario || '').toLowerCase().includes(searchTerm.toLowerCase())).map((p: any, idx) => {
                    let pStatus = 'Faltou';
                    let statusClass = 'bg-red-100 text-red-800';
                    if (p.status === 'ATESTADO MÉDICO') { pStatus = 'Atestado Médico'; statusClass = 'bg-blue-100 text-blue-800'; }
                    else if (p.status === 'PRESENTE') { pStatus = 'Presente'; statusClass = 'bg-green-100 text-green-800'; }
                    else if (p.status === 'MEIA DIÁRIA') { pStatus = 'Presente'; statusClass = 'bg-green-100 text-green-800'; }
                    
                    const tipoDiaria = p.tipo_diaria === 'MEIA_DIARIA' || p.status === 'MEIA DIÁRIA' ? 'MEIA DIÁRIA' : 'DIÁRIA';
                    const percent = p.percentual_diaria || (tipoDiaria === 'MEIA DIÁRIA' ? 50 : 100);
                    const vBase = Number(p.valor_diaria) || Number(p.valorDiaria) || 0;
                    const vCalc = Number(p.valor_calculado) || vBase;

                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {p.data ? format(parseISO(p.data), 'dd/MM/yyyy') : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {p.funcionario_nome || p.funcionario}
                          <div className="text-xs text-gray-500">{p.funcao}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {p.obra_nome || p.obra || 'Sem obra'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                            {pStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {p.status === 'FALTOU' ? '-' : tipoDiaria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {p.status === 'FALTOU' ? '-' : `${percent}%`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vBase)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {p.status === 'FALTOU' ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vCalc)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obra
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor da Diária
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dias Trabalhados
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Recebido
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorioAgrupado.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                         Nenhum registro encontrado para este período.
                       </td>
                    </tr>
                  ) : relatorioAgrupado.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.funcao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.obra}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorDiaria)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-medium">
                        {item.dias}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {relatorioAgrupado.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 p-6 print:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Quantidade de Funcionários</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{relatorioAgrupado.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Total de Diárias</p>
                  <p className="mt-1 text-2xl font-semibold text-blue-600">{totaisDias}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase">Valor Total da Folha</p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="hidden print:block p-8 mt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-right">
              Data de Emissão: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>
        </div>
    </div>
  );
}
