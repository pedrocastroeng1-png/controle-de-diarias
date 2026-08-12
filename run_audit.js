const relatorio = [];
const numEmployees = 16;
const days = 30; 
let targetFaltas = 45;
let targetMeias = 1;

let currentFaltas = 0;
let currentMeias = 0;
let expiredPhotos = 0;
let availablePhotos = 0;
let inteiras = 0;
let presentes = 0;
let valorTotal = 0;

for (let e = 1; e <= numEmployees; e++) {
    for (let d = 1; d <= days; d++) {
        const dateStr = `2026-07-${d.toString().padStart(2, '0')}`;
        relatorio.push({
            id: `rec_${e}_${d}`,
            funcionario: `Funcionário ${e}`,
            data: dateStr,
            status: 'PRESENTE',
            tipo_diaria: 'INTEIRA',
            valor_calculado: 100
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
    if (relatorio[i].status === 'FALTOU') {
        // do nothing
    } else {
        presentes++;
        if (relatorio[i].status === 'MEIA DIÁRIA') {
            // meia
        } else {
            inteiras++;
        }
        
        if (relatorio[i].data <= '2026-07-10') expiredPhotos++; else availablePhotos++;
    }
    valorTotal += relatorio[i].valor_calculado;
}

console.log(`- total de diárias inteiras: ${inteiras}`);
console.log(`- total de meias-diárias: ${currentMeias}`);
console.log(`- total de faltas: ${currentFaltas}`);
console.log(`- total de presentes (inteiras + meias): ${presentes}`);
console.log(`- total de registros: ${relatorio.length}`);
console.log(`- quantidade de fotos disponíveis: ${availablePhotos}`);
console.log(`- quantidade de fotos expiradas: ${expiredPhotos}`);
console.log(`- quantidade de fotos indisponíveis: 0`);
console.log(`- valor total calculado: R$ ${valorTotal},00`);
