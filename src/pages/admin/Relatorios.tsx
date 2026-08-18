import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Obra, Presenca } from '../../lib/types';
import { format, parseISO } from 'date-fns';
import { FileDown, Printer, Search, Table as TableIcon, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabase';
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
  const [viewMode, setViewMode] = useState<'relatorios' | 'pagamentos'>('relatorios');
  const [funcionariosBase, setFuncionariosBase] = useState<any[]>([]);

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
      setFuncionariosBase(funcionarios);
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
    const agrupado: Record<string, { id: string, nome: string, funcao: string, obra: string, dias: number, faltas: number, valorDiaria: number, total: number }> = {};
    
    relatorio.forEach((p: any) => {
      const fId = p.funcionario_id || p.funcionario_nome || p.funcionario;
      if (fId) {
        if (!agrupado[fId]) {
          agrupado[fId] = {
            id: p.funcionario_id || fId,
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

  const pagamentosCaixa = relatorioAgrupado.map(agrupado => {
    const funcionario = funcionariosBase.find(f => f.id === agrupado.id) || funcionariosBase.find(f => f.nome === agrupado.nome);
    return { ...agrupado, funcionario };
  }).filter(item => item.funcionario && item.funcionario.forma_pagamento === 'CAIXA ECONOMICA FEDERAL');

  const pagamentosPix = relatorioAgrupado.map(agrupado => {
    const funcionario = funcionariosBase.find(f => f.id === agrupado.id) || funcionariosBase.find(f => f.nome === agrupado.nome);
    return { ...agrupado, funcionario };
  }).filter(item => item.funcionario && item.funcionario.forma_pagamento === 'PIX');

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

          const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      const doc = new jsPDF();
      const obraNome = obras.find(o => o.id === obraId)?.nome || 'Todas as obras';
      const periodStr = dataInicial && dataFinal 
        ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
        : 'Todos os períodos';
        
      const emitDateStr = format(new Date(), 'dd/MM/yyyy HH:mm');
      
      // Safe Date Filtering
      const startD = dataInicial ? new Date(`${dataInicial}T00:00:00`) : null;
      const endD = dataFinal ? new Date(`${dataFinal}T23:59:59`) : null;
      
      const filteredRelatorio = relatorio.filter((r: any) => {
        if (!r.data) return false;
        const rDate = new Date(`${r.data}T12:00:00`);
        if (startD && rDate < startD) return false;
        if (endD && rDate > endD) return false;
        return true;
      });

      const fAgrupado: Record<string, any> = {};
      filteredRelatorio.forEach((p: any) => {
        const fId = p.funcionario_id || p.funcionario_nome || p.funcionario;
        if (fId) {
          if (!fAgrupado[fId]) {
            fAgrupado[fId] = {
              nome: p.funcionario_nome || p.funcionario || '',
              funcao: p.funcao_nome || p.funcao || '',
              obra: p.obra_nome || p.obra || '',
              dias: 0,
              faltas: 0,
              inteiras: 0,
              meias: 0,
              valorDiaria: Number(p.valor_diaria) || 0,
              total: 0,
              records: []
            };
          }
          const rowValor = Number(p.valor_calculado) || Number(p.valor_diaria) || 0;
          fAgrupado[fId].records.push(p);

          if (p.status === 'PRESENTE') {
            if (p.tipo_diaria === 'MEIA_DIARIA') {
               fAgrupado[fId].dias += 0.5;
               fAgrupado[fId].meias += 1;
               fAgrupado[fId].total += rowValor;
            } else {
               fAgrupado[fId].dias += 1;
               fAgrupado[fId].inteiras += 1;
               fAgrupado[fId].total += rowValor;
            }
          } else if (p.status === 'MEIA DIÁRIA') {
            fAgrupado[fId].dias += 0.5;
            fAgrupado[fId].meias += 1;
            fAgrupado[fId].total += rowValor;
          } else if (p.status === 'FALTOU') {
            fAgrupado[fId].faltas += 1;
          }
        }
      });
      const agrupado = Object.values(fAgrupado).sort((a: any, b: any) => a.nome.localeCompare(b.nome));

      let inteirasGeral = 0;
      let meiasGeral = 0;
      let faltasGeral = 0;
      let totalFolha = 0;
      
      filteredRelatorio.forEach((r: any) => {
        if (r.status === 'PRESENTE' && r.tipo_diaria !== 'MEIA_DIARIA') inteirasGeral++;
        if (r.status === 'MEIA DIÁRIA' || r.tipo_diaria === 'MEIA_DIARIA') meiasGeral++;
        if (r.status === 'FALTOU') faltasGeral++;
        if (r.status === 'PRESENTE' || r.status === 'MEIA DIÁRIA') {
             totalFolha += (Number(r.valor_calculado) || Number(r.valor_diaria) || 0);
        }
      });
      const totalFuncionarios = agrupado.length;
      
      const fetchImageAsBase64 = async (url: string) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!response.ok) return null;
          const blob = await response.blob();
          return new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          return null;
        }
      };

      // Page 1: Resumo
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 95);
      doc.setFont("helvetica", "bold");
      doc.text('CONTROLE DE DIÁRIAS', 14, 22);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text('RELATÓRIO DE DIÁRIAS', 14, 30);
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Período: ${periodStr}`, 14, 40);
      doc.text(`Obra: ${obraNome}`, 14, 46);
      doc.text(`Data de emissão: ${emitDateStr}`, 14, 52);

      // Indicadores Blocks
      const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, 60, 182, 22, 'FD'); // Box around indicators
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("FUNCIONÁRIOS", 20, 68);
      doc.text("DIÁRIAS INTEIRAS", 55, 68);
      doc.text("MEIAS-DIÁRIAS", 95, 68);
      doc.text("FALTAS", 135, 68);
      doc.text("TOTAL CALCULADO", 160, 68);
      
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 95);
      doc.setFont("helvetica", "bold");
      doc.text(`${totalFuncionarios}`, 20, 76);
      doc.text(`${inteirasGeral}`, 55, 76);
      doc.text(`${meiasGeral}`, 95, 76);
      doc.text(`${faltasGeral}`, 135, 76);
      doc.text(`${formatCurrency(totalFolha)}`, 160, 76);

      // Table Resumo
      const tableColumn = ["Funcionário", "Função", "Obra", "Valor da Diária", "Inteiras", "Meias", "Faltas", "Total"];
      const tableRows = agrupado.map(f => [
        f.nome,
        f.funcao,
        f.obra || obraNome,
        formatCurrency(f.valorDiaria),
        f.inteiras.toString(),
        f.meias.toString(),
        f.faltas.toString(),
        formatCurrency(f.total)
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 90,
        theme: 'striped',
        styles: { fontSize: 8, textColor: [30, 58, 95] },
        headStyles: { fillColor: [30, 58, 95], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Page 2+: Individual Details (Continuous flow)
      for (const resumoFunc of agrupado) {
        
        // Header needs ~45 units. If not enough space, new page.
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFillColor(30, 58, 95);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text('CONTROLE INDIVIDUAL DE DIÁRIAS', 16, currentY + 6);
        currentY += 14;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(resumoFunc.nome.toUpperCase(), 14, currentY);
        currentY += 6;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Função: ${resumoFunc.funcao}`, 14, currentY); currentY += 5;
        doc.text(`Obra: ${resumoFunc.obra || obraNome}`, 14, currentY); currentY += 5;
        doc.text(`Período: ${periodStr}`, 14, currentY); currentY += 7;
        
        doc.setFont("helvetica", "bold");
        doc.text("Resumo:", 14, currentY); currentY += 5;
        doc.setFont("helvetica", "normal");
        doc.text(`Diárias inteiras: ${resumoFunc.inteiras} | Meias-diárias: ${resumoFunc.meias} | Faltas: ${resumoFunc.faltas} | Total calculado: ${formatCurrency(resumoFunc.total)}`, 14, currentY);
        currentY += 10;
        
        const records = resumoFunc.records.sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime());
        
                for (const record of records) {
          const dataStr = format(parseISO(record.data), 'dd/MM/yyyy');
          const isFalta = record.status === 'FALTOU';
          const isAtestado = record.status === 'ATESTADO MÉDICO';
          const isFerias = record.status === 'FÉRIAS';
          const isFolga = record.status === 'FOLGA';
          const isMeia = record.tipo_diaria === 'MEIA_DIARIA' || record.status === 'MEIA DIÁRIA';
          const isPresente = record.status === 'PRESENTE' || isMeia;
          
          const blockHeight = isPresente ? 35 : 12; 
          
          if (currentY + blockHeight > 280) {
            doc.addPage();
            currentY = 20;
          }
          
          doc.setDrawColor(226, 232, 240);
          doc.line(14, currentY, 196, currentY);
          currentY += 6;
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          
          // Date
          doc.setTextColor(0, 0, 0);
          doc.text(`${dataStr}`, 14, currentY);
          
          if (isFalta) {
            doc.setTextColor(185, 28, 28);
            doc.text(`FALTOU`, 45, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            doc.text(`VALOR: R$ 0,00`, 110, currentY);
            currentY += 4;
          } else if (isAtestado || isFerias || isFolga) {
            doc.setTextColor(180, 83, 9);
            doc.text(`${record.status}`, 45, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            currentY += 4;
          } else if (isPresente) {
            doc.setTextColor(21, 128, 61);
            const statusLabel = isMeia ? 'MEIA DIÁRIA' : 'PRESENTE';
            doc.text(statusLabel, 45, currentY);
            
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            const vCalc = Number(record.valor_calculado) || 0;
            doc.text(`VALOR: ${formatCurrency(vCalc)}`, 110, currentY);
            
            let photoMeta: any = null;
            if (record.id && supabase) {
                try {
                    const fetchMetaPromise = supabase.from('presencas').select('photo_path, photo_taken_at').eq('id', record.id).single();
                    const fetchMetaRes: any = await Promise.race([
                        fetchMetaPromise,
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Supabase Meta')), 3000))
                    ]);
                    if (fetchMetaRes && fetchMetaRes.data) {
                        photoMeta = { path: fetchMetaRes.data.photo_path, taken_at: fetchMetaRes.data.photo_taken_at };
                    }
                } catch (e) {
                    console.warn(`Falha metadados foto ${record.id}`);
                }
            }

            if ((photoMeta && photoMeta.path) || record.atestado_photo_path) {
               const photoDate = new Date((photoMeta && photoMeta.taken_at) ? photoMeta.taken_at : record.data);
               const twentyDaysAgo = new Date();
               twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
               
               if (photoDate < twentyDaysAgo) {
                 doc.setFontSize(8);
                 doc.setTextColor(100, 116, 139);
                 doc.text(`FOTO EXPIRADA`, 150, currentY);
                 doc.setTextColor(0, 0, 0);
                 currentY += 4;
               } else {
                 try {
                   const bucket = record.status === 'ATESTADO MÉDICO' ? 'medical-certificates' : 'attendance-photos';
                   const path = photoMeta ? photoMeta.path : record.atestado_photo_path;
                   const urlPromise = api.getPhotoUrl(bucket, path);
                   const url = await Promise.race([
                     urlPromise,
                     new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout URL')), 4000))
                   ]);
                   const imgData = await fetchImageAsBase64(url);
                   
                   if (imgData) {
                     const pdfWidth = 20;
                     const pdfHeight = 26; 
                     doc.addImage(imgData, 'JPEG', 150, currentY - 4, pdfWidth, pdfHeight);
                     currentY += 26; // move past the miniature
                   } else {
                     doc.setFontSize(8);
                     doc.setTextColor(100, 116, 139);
                     doc.text(`FOTO INDISPONÍVEL`, 150, currentY);
                     doc.setTextColor(0, 0, 0);
                     currentY += 4;
                   }
                 } catch (e) {
                   doc.setFontSize(8);
                   doc.setTextColor(100, 116, 139);
                   doc.text(`FOTO INDISPONÍVEL`, 150, currentY);
                   doc.setTextColor(0, 0, 0);
                   currentY += 4;
                 }
               }
            } else {
               currentY += 4;
            }
          }
        }
        
        currentY += 10;
      }
      
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('CONTROLE DE DIÁRIAS', 14, 10);
        
        doc.text(`Documento interno`, 14, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      }
      
      let baseFileName = 'controle_diarias';
      if (obraNome !== 'Todas as obras') {
         baseFileName += '_' + obraNome.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      }
      const dateName = (dataInicial && dataFinal) ? `${dataInicial}_ate_${dataFinal}` : format(new Date(), 'dd-MM-yyyy');
      doc.save(`${baseFileName}_${dateName}.pdf`);
      
    } catch (e: any) {
      console.error('[PDF] Ocorreu uma exceção no fluxo:', e);
      setErro('Ocorreu um erro ao gerar o PDF. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

    const handleExportDailyPDF = async () => {
    const targetDate = dataInicial || hoje;
    
    // Filter by exact date
    const dailyData = relatorio.filter(r => r.data === targetDate);
    const emitDateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.text('CONTROLE DE PRESENÇA', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${format(parseISO(targetDate), 'dd/MM/yyyy')}`, 14, 32);
    doc.text(`Data de emissão: ${emitDateStr}`, 14, 38);

    const obrasGroup: Record<string, any[]> = {};
    let totalPresentes = 0;
    let totalFaltas = 0;
    let totalAtestados = 0;

    dailyData.forEach(p => {
      const obraName = p.obra_nome || p.obra || 'Sem Obra';
      if (!obrasGroup[obraName]) obrasGroup[obraName] = [];
      obrasGroup[obraName].push(p);
      
      if (p.status === 'PRESENTE' && p.tipo_diaria === 'MEIA_DIARIA') totalPresentes += 0.5;
      else if (p.status === 'PRESENTE') totalPresentes += 1;
      else if (p.status === 'MEIA DIÁRIA') totalPresentes += 0.5;
      else if (p.status === 'FALTOU') totalFaltas++;
      else if (p.status === 'ATESTADO MÉDICO') totalAtestados++;
    });

    let currentY = 50;

    Object.keys(obrasGroup).sort().forEach(obraName => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFillColor(30, 58, 95);
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`Obra: ${obraName}`, 16, currentY + 6);
      currentY += 12;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      
      const funcs = obrasGroup[obraName].sort((a, b) => (a.funcionario_nome || a.funcionario || '').localeCompare(b.funcionario_nome || b.funcionario || ''));
      funcs.forEach(f => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
        let statusText = 'PRESENTE';
        if (f.status === 'ATESTADO MÉDICO') statusText = 'ATESTADO MÉDICO';
        else if (f.status === 'PRESENTE' && f.tipo_diaria === 'MEIA_DIARIA') statusText = 'MEIA DIÁRIA';
        else if (f.status === 'MEIA DIÁRIA') statusText = 'MEIA DIÁRIA';
        else if (f.status === 'FALTOU') statusText = 'FALTOU';
        else if (f.status === 'FÉRIAS') statusText = 'FÉRIAS';
        else if (f.status === 'FOLGA') statusText = 'FOLGA';
        
        doc.text(`${f.funcionario_nome || f.funcionario}`, 14, currentY);
        doc.text(`[${statusText}]`, 130, currentY);
        currentY += 6;
      });
      currentY += 6;
    });

    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 35, 'FD');

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`RESUMO GERAL`, 20, currentY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Funcionários: ${dailyData.length}`, 20, currentY + 16);
    doc.text(`Presentes (Diárias): ${totalPresentes}`, 20, currentY + 22);
    doc.text(`Faltas: ${totalFaltas}`, 20, currentY + 28);
    
    currentY += 45;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Operador Responsável: ${usuario?.usuario || 'Sistema'}`, 14, currentY);

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('CONTROLE DE DIÁRIAS', 14, 10);
      doc.text(`Documento interno`, 14, doc.internal.pageSize.height - 10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`relatorio_diario_${targetDate}.pdf`);
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
      cellA1.value = 'CONTROLE DE DIÁRIAS';
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

  const handleExportPagamentosCaixa = () => {
    const doc = new jsPDF();
    const periodStr = (dataInicial && dataFinal) 
      ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
      : 'Todos os períodos';
    
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.text('CONTROLE DE PAGAMENTOS', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text('PAGAMENTOS — CAIXA ECONÔMICA FEDERAL', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`PERÍODO: ${periodStr}`, 14, 40);
    
    const totalPagar = pagamentosCaixa.reduce((acc, curr) => acc + curr.total, 0);
    doc.text(`FUNCIONÁRIOS: ${pagamentosCaixa.length}`, 14, 46);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagar)}`, 14, 52);
    doc.setFont("helvetica", "normal");

    const tableData: any[] = [];
    
    pagamentosCaixa.forEach(item => {
      const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total);
      const agencia = item.funcionario?.agencia || '';
      const tipoConta = item.funcionario?.tipo_conta === 'CONTA CORRENTE' ? 'Corrente' : (item.funcionario?.tipo_conta === 'CONTA POUPANÇA' ? 'Poupança' : '');
      const conta = item.funcionario?.conta || '';
      
      tableData.push([item.nome, valor, agencia, tipoConta, conta]);
      
      if (item.funcionario?.observacao_pagamento) {
        tableData.push([{ content: `OBSERVAÇÃO: ${item.funcionario.observacao_pagamento}`, colSpan: 5, styles: { fontStyle: 'italic', textColor: [100, 116, 139] } }]);
      }
    });

    autoTable(doc, {
      startY: 60,
      head: [['FUNCIONÁRIO', 'VALOR', 'AGÊNCIA', 'TIPO', 'CONTA']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      didDrawPage: function (data) {
        const str = 'Página ' + (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    const fileName = `pagamentos_caixa_${getFileNameBase()}.pdf`;
    doc.save(fileName);
  };

  const handleExportPagamentosPix = () => {
    const doc = new jsPDF();
    const periodStr = (dataInicial && dataFinal) 
      ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
      : 'Todos os períodos';
    
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 95);
    doc.setFont("helvetica", "bold");
    doc.text('CONTROLE DE PAGAMENTOS', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text('PAGAMENTOS — PIX', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`PERÍODO: ${periodStr}`, 14, 40);
    
    const totalPagar = pagamentosPix.reduce((acc, curr) => acc + curr.total, 0);
    doc.text(`FUNCIONÁRIOS: ${pagamentosPix.length}`, 14, 46);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL A PAGAR: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagar)}`, 14, 52);
    doc.setFont("helvetica", "normal");

    const tableData: any[] = [];
    
    pagamentosPix.forEach(item => {
      const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total);
      const chavePix = item.funcionario?.chave_pix || '';
      
      tableData.push([item.nome, valor, chavePix]);
      
      if (item.funcionario?.observacao_pagamento) {
        tableData.push([{ content: `OBSERVAÇÃO: ${item.funcionario.observacao_pagamento}`, colSpan: 3, styles: { fontStyle: 'italic', textColor: [100, 116, 139] } }]);
      }
    });

    autoTable(doc, {
      startY: 60,
      head: [['FUNCIONÁRIO', 'VALOR', 'CHAVE PIX']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      didDrawPage: function (data) {
        const str = 'Página ' + (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    const fileName = `pagamentos_pix_${getFileNameBase()}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 print:hidden gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Resultados</h2>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('relatorios')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'relatorios' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Relatórios
            </button>
            <button
              onClick={() => setViewMode('pagamentos')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'pagamentos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pagamentos
            </button>
          </div>
        </div>
        <div className="relative w-full md:w-64">
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

      {viewMode === 'relatorios' ? (
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
      ) : (
        <div className="space-y-8">
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <h3 className="text-xl font-bold text-gray-900">Resumo de Pagamentos</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportPagamentosCaixa}
                  className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
                  title="Gerar PDF - CAIXA"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF CAIXA
                </button>
                <button
                  onClick={handleExportPagamentosPix}
                  className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
                  title="Gerar PDF - PIX"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF PIX
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              <strong>PERÍODO:</strong> {dataInicial && dataFinal 
                ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
                : 'Todos os períodos'}
            </p>
            
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                FUNCIONÁRIOS COM CAIXA ECONÔMICA FEDERAL
              </h4>
              {pagamentosCaixa.length === 0 ? (
                <p className="text-sm text-gray-500 italic px-4">Nenhum funcionário encontrado nesta categoria para o período.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagamentosCaixa.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{item.nome}</div>
                        <div className="text-blue-700 font-semibold text-lg mt-1 mb-3">
                          Valor a receber: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                        </div>
                        <div className="text-sm text-gray-700 space-y-1 bg-gray-50 p-3 rounded-md border border-gray-100">
                          <div className="font-medium">Caixa Econômica Federal</div>
                          <div><span className="text-gray-500">Agência:</span> {item.funcionario?.agencia || 'Não informada'}</div>
                          <div><span className="text-gray-500">Conta:</span> {item.funcionario?.tipo_conta === 'CONTA CORRENTE' ? 'Corrente' : (item.funcionario?.tipo_conta === 'CONTA POUPANÇA' ? 'Poupança' : 'Não informado')}</div>
                          <div><span className="text-gray-500">Número:</span> {item.funcionario?.conta || 'Não informada'}</div>
                        </div>
                        {item.funcionario?.observacao_pagamento && (
                          <div className="mt-3 text-sm text-gray-700 bg-amber-50 p-3 rounded-md border border-amber-100">
                            <div className="font-semibold text-amber-800 mb-1">OBSERVAÇÃO:</div>
                            <div className="italic">{item.funcionario.observacao_pagamento}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                FUNCIONÁRIOS COM PIX
              </h4>
              {pagamentosPix.length === 0 ? (
                <p className="text-sm text-gray-500 italic px-4">Nenhum funcionário encontrado nesta categoria para o período.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pagamentosPix.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{item.nome}</div>
                        <div className="text-blue-700 font-semibold text-lg mt-1 mb-3">
                          Valor a receber: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                        </div>
                        <div className="text-sm text-gray-700 space-y-1 bg-gray-50 p-3 rounded-md border border-gray-100">
                          <div className="font-medium">PIX</div>
                          <div><span className="text-gray-500">Chave:</span> {item.funcionario?.chave_pix || 'Não informada'}</div>
                        </div>
                        {item.funcionario?.observacao_pagamento && (
                          <div className="mt-3 text-sm text-gray-700 bg-amber-50 p-3 rounded-md border border-amber-100">
                            <div className="font-semibold text-amber-800 mb-1">OBSERVAÇÃO:</div>
                            <div className="italic">{item.funcionario.observacao_pagamento}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
