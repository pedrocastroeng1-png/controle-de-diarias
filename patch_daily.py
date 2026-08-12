import re

with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

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

# Use regex to find and replace
pattern = r'const handleExportDailyPDF = async \(\) => \{.*?(?=const handleExportExcel = async)'
content = re.sub(pattern, new_handleExportDailyPDF + '\n\n  ', content, flags=re.DOTALL)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
