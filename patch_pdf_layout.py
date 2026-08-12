import re

with open('src/pages/admin/Relatorios.tsx', 'r') as f:
    content = f.read()

# We need to replace the section starting from:
# for (const record of records) {
# ...
# }
# currentY += 10;
# } // end of function loop

# Let's write the exact block.
# Actually, I'll use a regex that matches the for (const record of records) { block inside handleExportPDF.

new_block = """        for (const record of records) {
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
        }"""

pattern = r'for \(const record of records\) \{.*?(?=\s*currentY \+= 10;\s*\}\s*const pageCount)'
content = re.sub(pattern, new_block + "\n        ", content, flags=re.DOTALL)

with open('src/pages/admin/Relatorios.tsx', 'w') as f:
    f.write(content)
