import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const relatorio = [];
const numEmployees = 16;
const days = 30; 
let targetFaltas = 45;
let targetMeias = 1;

let currentFaltas = 0;
let currentMeias = 0;
let expiredPhotos = 0;
let availablePhotos = 0;

for (let e = 1; e <= numEmployees; e++) {
    for (let d = 1; d <= days; d++) {
        const dateStr = `2026-07-${d.toString().padStart(2, '0')}`;
        relatorio.push({
            id: `rec_${e}_${d}`,
            funcionario: `Funcionário ${e}`,
            funcao: 'Servente',
            obra: 'Obra Teste',
            data: dateStr,
            status: 'PRESENTE',
            tipo_diaria: 'INTEIRA',
            valor_diaria: 100,
            valor_calculado: 100,
            photo_taken_at: dateStr,
            photo_path: 'path/to/photo.jpg'
        });
    }
}
for (let i=0; i<relatorio.length; i++) {
    if (currentFaltas < targetFaltas && relatorio[i].status !== 'FALTOU') {
        relatorio[i].status = 'FALTOU';
        relatorio[i].valor_calculado = 0;
        currentFaltas++;
    } else if (currentMeias < targetMeias && relatorio[i].status !== 'FALTOU' && relatorio[i].status !== 'MEIA DIÁRIA') {
        relatorio[i].status = 'MEIA DIÁRIA';
        relatorio[i].tipo_diaria = 'MEIA_DIARIA';
        relatorio[i].valor_calculado = 50;
        currentMeias++;
    }
}

for (let i=0; i<relatorio.length; i++) {
    if (relatorio[i].status !== 'FALTOU') {
        if (relatorio[i].data <= '2026-07-10') expiredPhotos++; else availablePhotos++;
    }
}

const fAgrupado = {};
relatorio.forEach(p => {
    const fId = p.funcionario;
    if (!fAgrupado[fId]) {
        fAgrupado[fId] = {
            nome: p.funcionario,
            funcao: p.funcao,
            obra: p.obra,
            dias: 0, faltas: 0, inteiras: 0, meias: 0, valorDiaria: 100, total: 0, records: []
        };
    }
    const rowValor = p.valor_calculado;
    fAgrupado[fId].records.push(p);

    if (p.status === 'PRESENTE') {
        if (p.tipo_diaria === 'MEIA_DIARIA') {
            fAgrupado[fId].dias += 0.5; fAgrupado[fId].meias += 1; fAgrupado[fId].total += rowValor;
        } else {
            fAgrupado[fId].dias += 1; fAgrupado[fId].inteiras += 1; fAgrupado[fId].total += rowValor;
        }
    } else if (p.status === 'MEIA DIÁRIA') {
        fAgrupado[fId].dias += 0.5; fAgrupado[fId].meias += 1; fAgrupado[fId].total += rowValor;
    } else if (p.status === 'FALTOU') {
        fAgrupado[fId].faltas += 1;
    }
});
const agrupado = Object.values(fAgrupado);

const doc = new jsPDF();
let currentY = 90;

const tableRows = agrupado.map(f => [ f.nome, f.funcao, f.obra, "100", f.inteiras, f.meias, f.faltas, f.total ]);
autoTable(doc, {
    head: [["Funcionário", "Função", "Obra", "Valor da Diária", "Inteiras", "Meias", "Faltas", "Total"]],
    body: tableRows,
    startY: 90
});
currentY = doc.lastAutoTable.finalY + 15;

for (const resumoFunc of agrupado) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    currentY += 14 + 6 + 5 + 5 + 7 + 5 + 10; 
    
    for (const record of resumoFunc.records) {
        const isFalta = record.status === 'FALTOU';
        const isPresente = record.status === 'PRESENTE' || record.status === 'MEIA DIÁRIA';
        
        const blockHeight = isPresente ? 35 : 12; 
        
        if (currentY + blockHeight > 280) {
            doc.addPage();
            currentY = 20;
        }
        
        currentY += 6;
        
        if (isFalta) {
            currentY += 4;
        } else if (isPresente) {
            const isExpired = record.data <= '2026-07-10'; 
            if (isExpired) {
                currentY += 4;
            } else {
                currentY += 26;
            }
        }
    }
    currentY += 10;
}

console.log(`1. Funcionários utilizados: ${numEmployees}`);
console.log(`2. Período: 01/07/2026 a 30/07/2026`);
console.log(`3. Total de registros: ${relatorio.length}`);
console.log(`4. Fotos disponíveis: ${availablePhotos}`);
console.log(`5. Fotos expiradas: ${expiredPhotos}`);
console.log(`6. Faltas: ${currentFaltas}`);
console.log(`7. Meias-diárias: ${currentMeias}`);
console.log(`8. TOTAL DE PÁGINAS GERADAS: ${doc.internal.getNumberOfPages()}`);
