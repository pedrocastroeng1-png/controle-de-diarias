import re

with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

# Replace handleExportPDF
new_handleExportPDF = """  const handleExportPDF = async () => {
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
          
          const blockHeight = isPresente ? 85 : 30; 
          
          if (currentY + blockHeight > 280) {
            doc.addPage();
            currentY = 20;
          }
          
          doc.setDrawColor(226, 232, 240);
          doc.line(14, currentY, 196, currentY);
          currentY += 6;
          
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          
          if (isFalta) {
            doc.setTextColor(185, 28, 28);
            doc.text(`${dataStr} - FALTOU`, 14, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            currentY += 6;
            doc.text(`VALOR CALCULADO: R$ 0,00`, 14, currentY);
            currentY += 10;
          } else if (isAtestado || isFerias || isFolga) {
            doc.setTextColor(180, 83, 9);
            doc.text(`${dataStr} - ${record.status}`, 14, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            currentY += 10;
          } else if (isPresente) {
            doc.setTextColor(21, 128, 61);
            doc.text(`${dataStr} - PRESENTE`, 14, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            currentY += 6;
            
            doc.text(`DIÁRIA: ${isMeia ? 'MEIA DIÁRIA' : 'INTEIRA'}`, 14, currentY); currentY += 5;
            const vBase = Number(record.valor_diaria) || 0;
            const vCalc = Number(record.valor_calculado) || 0;
            doc.text(`VALOR DA DIÁRIA: ${formatCurrency(vBase)}`, 14, currentY); currentY += 5;
            doc.text(`VALOR CALCULADO: ${formatCurrency(vCalc)}`, 14, currentY); currentY += 7;
            
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
               doc.setFont("helvetica", "bold");
               doc.text(`FOTO DA PRESENÇA:`, 14, currentY);
               doc.setFont("helvetica", "normal");
               currentY += 6;
               
               const photoDate = new Date((photoMeta && photoMeta.taken_at) ? photoMeta.taken_at : record.data);
               const twentyDaysAgo = new Date();
               twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
               
               if (photoDate < twentyDaysAgo) {
                 doc.setTextColor(100, 116, 139);
                 doc.text(`FOTO EXPIRADA`, 14, currentY + 10);
                 doc.setTextColor(0, 0, 0);
                 currentY += 25;
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
                     const pdfWidth = 45;
                     const pdfHeight = 60; 
                     doc.addImage(imgData, 'JPEG', 14, currentY, pdfWidth, pdfHeight);
                     currentY += pdfHeight + 5;
                   } else {
                     doc.setTextColor(100, 116, 139);
                     doc.text(`FOTO INDISPONÍVEL`, 14, currentY + 10);
                     doc.setTextColor(0, 0, 0);
                     currentY += 25;
                   }
                 } catch (e) {
                   doc.setTextColor(100, 116, 139);
                   doc.text(`FOTO INDISPONÍVEL`, 14, currentY + 10);
                   doc.setTextColor(0, 0, 0);
                   currentY += 25;
                 }
               }
            } else {
               currentY += 6;
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
  };"""

new_handleExportDailyPDF = """  const handleExportDailyPDF = async () => {
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
  };"""

content = re.sub(r'const handleExportPDF = async \(\) => \{[\s\S]*?catch\s*\(e: any\)\s*\{[\s\S]*?\}\s*finally\s*\{[\s\S]*?\}\s*\};', new_handleExportPDF, content)
content = re.sub(r'const handleExportDailyPDF = async \(\) => \{[\s\S]*?doc\.save\([^\)]+\);\s*\};', new_handleExportDailyPDF, content)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
