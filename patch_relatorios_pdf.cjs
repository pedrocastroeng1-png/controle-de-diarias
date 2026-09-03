const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Relatorios.tsx', 'utf8');

const pdfAnchor = `      relatorioAgrupado.forEach(item => {
        tableData.push([
          item.nome,
          item.funcao,
          item.obra,
          formatCurrency(item.valorDiaria),
          item.dias.toString(),
          formatCurrency(item.total)
        ]);
      });`;

const newPdf = `      relatorioAgrupado.forEach(item => {
        tableData.push([
          item.nome,
          item.funcao,
          item.obra,
          item.isCLT ? '-' : formatCurrency(item.valorDiaria),
          item.dias.toString(),
          item.isCLT ? 'PAGAMENTO EM FOLHA - CLT' : formatCurrency(item.total)
        ]);
      });`;

code = code.replace(pdfAnchor, newPdf);
fs.writeFileSync('src/pages/admin/Relatorios.tsx', code);
