import re

with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

# Fix imports
content = content.replace("import 'jspdf-autotable';", "import autoTable from 'jspdf-autotable';\nimport { supabase } from '../../lib/supabase';")

new_handle_export = """  const handleExportPDF = async () => {
    try {
      setLoading(true);
      console.log('[PDF] Iniciando geração');
      const doc = new jsPDF();
      const obraNome = obras.find(o => o.id === obraId)?.nome || 'Todas';
      const periodStr = dataInicial && dataFinal 
        ? `${format(parseISO(dataInicial), 'dd/MM/yyyy')} a ${format(parseISO(dataFinal), 'dd/MM/yyyy')}`
        : 'Todos os períodos';
      
      const agrupado = relatorioAgrupado;
      const totalFolha = valorTotal;
      const totalDiarias = totaisDias;
      const totalFuncionarios = agrupado.length;
      
      // Fetch photos metadata for current dataset
      const presencaIds = relatorio
        .filter((r: any) => (r.status === 'PRESENTE' || r.status === 'MEIA DIÁRIA') && r.id)
        .map((r: any) => r.id);
        
      const photosMap: Record<string, { path: string; taken_at: string }> = {};
      
      if (presencaIds.length > 0 && supabase) {
        const chunkSize = 500;
        for (let i = 0; i < presencaIds.length; i += chunkSize) {
          const chunk = presencaIds.slice(i, i + chunkSize);
          const { data } = await supabase.from('presencas')
            .select('id, photo_path, photo_taken_at')
            .in('id', chunk)
            .not('photo_path', 'is', null);
            
          if (data) {
            data.forEach(d => {
              photosMap[d.id] = { path: d.photo_path, taken_at: d.photo_taken_at };
            });
          }
        }
      }

      const fetchImageAsBase64 = async (url: string) => {
        try {
          const response = await fetch(url);
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
      doc.setFont("helvetica", "bold");
      doc.text('CONTROLE DE DIÁRIAS', 14, 22);
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.text('RELATÓRIO DE DIÁRIAS', 14, 32);
      
      doc.setFontSize(11);
      doc.text(`Período: ${periodStr}`, 14, 42);
      doc.text(`Obra: ${obraNome}`, 14, 48);

      let inteirasGeral = 0;
      let meiasGeral = 0;
      let faltasGeral = 0;
      relatorio.forEach((r: any) => {
        if (r.status === 'PRESENTE' && r.tipo_diaria !== 'MEIA_DIARIA') inteirasGeral++;
        if (r.status === 'MEIA DIÁRIA' || r.tipo_diaria === 'MEIA_DIARIA') meiasGeral++;
        if (r.status === 'FALTOU') faltasGeral++;
      });
      
      doc.text(`FUNCIONÁRIOS: ${totalFuncionarios}`, 14, 60);
      doc.text(`DIÁRIAS INTEIRAS: ${inteirasGeral}`, 14, 66);
      doc.text(`MEIAS-DIÁRIAS: ${meiasGeral}`, 14, 72);
      doc.text(`FALTAS: ${faltasGeral}`, 14, 78);
      
      doc.setFont("helvetica", "bold");
      doc.text(`TOTAL CALCULADO: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFolha)}`, 14, 86);
      
      const tableColumn = ["Funcionário", "Função", "Diárias", "Meias", "Faltas", "Total"];
      const tableRows = agrupado.map(f => [
        f.nome,
        f.funcao,
        f.dias.toString(),
        f.faltas.toString(),
        (relatorio.filter((r: any) => (r.funcionario_id === f.id || r.funcionario === f.nome) && r.status === 'FALTOU').length).toString(),
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(f.total)
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 95,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] }
      });
      
      const relatorioPorFunc = {};
      relatorio.forEach((r: any) => {
        const fId = r.funcionario_id || r.funcionario_nome || r.funcionario;
        if (!relatorioPorFunc[fId]) relatorioPorFunc[fId] = [];
        relatorioPorFunc[fId].push(r);
      });
      
      // Page 2+: Individual Details
      for (const resumoFunc of agrupado) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text('CONTROLE DE DIÁRIAS', 14, 20);
        
        doc.setFontSize(12);
        doc.text(`FUNCIONÁRIO: ${resumoFunc.nome}`, 14, 30);
        doc.setFont("helvetica", "normal");
        doc.text(`Função: ${resumoFunc.funcao}`, 14, 36);
        doc.text(`Obra: ${resumoFunc.obra || obraNome}`, 14, 42);
        doc.text(`Período: ${periodStr}`, 14, 48);

        let currentY = 60;
        
        const key = relatorio.find((r: any) => r.funcionario === resumoFunc.nome || r.funcionario_nome === resumoFunc.nome)?.funcionario_id || resumoFunc.nome;
        const records = (relatorioPorFunc[key] || relatorioPorFunc[resumoFunc.nome] || []).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
        
        for (const record of records) {
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          }
          
          const dataStr = format(parseISO(record.data), 'dd/MM/yyyy');
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          
          if (record.status === 'FALTOU') {
            doc.setTextColor(220, 38, 38);
            doc.text(`${dataStr}  🔴 FALTOU`, 14, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            currentY += 6;
            doc.text(`Valor: R$ 0,00`, 14, currentY);
            currentY += 12;
          } else if (record.status === 'PRESENTE' || record.status === 'MEIA DIÁRIA') {
            doc.setTextColor(22, 163, 74);
            doc.text(`${dataStr}  🟢 PRESENTE`, 14, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            currentY += 6;
            
            const isMeia = record.tipo_diaria === 'MEIA_DIARIA' || record.status === 'MEIA DIÁRIA';
            doc.text(`Diária: ${isMeia ? 'MEIA DIÁRIA' : 'INTEIRA'}`, 14, currentY);
            currentY += 6;
            
            const vBase = record.valor_diaria || 0;
            const vCalc = record.valor_calculado || 0;
            doc.text(`Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vBase)}`, 14, currentY);
            currentY += 6;
            
            if (isMeia) {
              doc.text(`Valor calculado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vCalc)}`, 14, currentY);
              currentY += 6;
            }
            
            const photoMeta = photosMap[record.id];
            if (photoMeta || record.atestado_photo_path) {
               doc.text(`Foto da presença:`, 14, currentY);
               currentY += 6;
               
               const photoDate = new Date((photoMeta && photoMeta.taken_at) ? photoMeta.taken_at : record.data);
               const twentyDaysAgo = new Date();
               twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
               
               if (photoDate < twentyDaysAgo) {
                 doc.setTextColor(156, 163, 175);
                 doc.text(`📸 FOTO EXPIRADA`, 14, currentY + 10);
                 doc.setTextColor(0, 0, 0);
                 currentY += 25;
               } else {
                 try {
                   const bucket = record.status === 'ATESTADO MÉDICO' ? 'medical-certificates' : 'attendance-photos';
                   const path = photoMeta ? photoMeta.path : record.atestado_photo_path;
                   const url = await api.getPhotoUrl(bucket, path);
                   const imgData = await fetchImageAsBase64(url);
                   if (imgData) {
                     const pdfWidth = 50;
                     const pdfHeight = 65; 
                     
                     if (currentY + pdfHeight > 275) {
                       doc.addPage();
                       currentY = 20;
                     }
                     doc.addImage(imgData, 'JPEG', 14, currentY, pdfWidth, pdfHeight);
                     currentY += pdfHeight + 8;
                   } else {
                     doc.setTextColor(156, 163, 175);
                     doc.text(`📸 FOTO EXPIRADA`, 14, currentY + 10);
                     doc.setTextColor(0, 0, 0);
                     currentY += 25;
                   }
                 } catch (e) {
                   doc.setTextColor(156, 163, 175);
                   doc.text(`📸 FOTO EXPIRADA`, 14, currentY + 10);
                   doc.setTextColor(0, 0, 0);
                   currentY += 25;
                 }
               }
            } else {
              currentY += 6;
            }
          } else if (record.status === 'ATESTADO MÉDICO') {
            doc.setTextColor(37, 99, 235);
            doc.text(`${dataStr}  🩺 ATESTADO MÉDICO`, 14, currentY);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            currentY += 12;
          }
        }
        
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }
        
        currentY += 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text('RESUMO DO FUNCIONÁRIO', 14, currentY);
        currentY += 8;
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        
        const fMeias = records.filter((r: any) => r.status === 'MEIA DIÁRIA' || r.tipo_diaria === 'MEIA_DIARIA').length;
        const fInteiras = records.filter((r: any) => r.status === 'PRESENTE' && r.tipo_diaria !== 'MEIA_DIARIA').length;
        const fFaltas = records.filter((r: any) => r.status === 'FALTOU').length;
        
        doc.text(`Diárias inteiras: ${fInteiras}`, 14, currentY); currentY += 6;
        doc.text(`Meias-diárias: ${fMeias}`, 14, currentY); currentY += 6;
        doc.text(`Faltas: ${fFaltas}`, 14, currentY); currentY += 10;
        
        doc.setFont("helvetica", "bold");
        doc.text(`Valor total calculado:`, 14, currentY); currentY += 6;
        doc.text(`${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resumoFunc.total)}`, 14, currentY);
      }
      
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 10);
      }
      
      doc.save(`${getFileNameBase()}.pdf`);
    } catch (e: any) {
      console.error(e);
      setErro('Ocorreu um erro ao gerar o PDF.');
    } finally {
      setLoading(false);
    }
  };"""

content = re.sub(r'const handleExportPDF = \(\) => \{[\s\S]*?\}\s*catch\s*\(e: any\)\s*\{[\s\S]*?\}\s*\};', new_handle_export, content)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
