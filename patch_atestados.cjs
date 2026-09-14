const fs = require('fs');
let content = fs.readFileSync('src/lib/atestados-relatorio.ts', 'utf8');

const target1 = `export function diasUteisAtestado(inicio: string, fim: string): string[] {`;
const replace1 = `export function diasUteisAtestado(inicio: string, fim: string, feriados: string[] = []): string[] {`;
content = content.replace(target1, replace1);

const target2 = `    if (date.getUTCDay() >= 1 && date.getUTCDay() <= 5) result.push(date.toISOString().slice(0, 10));`;
const replace2 = `    const dateStr = date.toISOString().slice(0, 10);
    if (date.getUTCDay() >= 1 && date.getUTCDay() <= 5 && !feriados.includes(dateStr)) {
      result.push(dateStr);
    }`;
content = content.replace(target2, replace2);

const target3 = `export function aplicarAtestados(registros: RegistroRelatorio[], atestados: Atestado[], funcionarios: Funcionario[], filtro: Filtro = {}): RegistroRelatorio[] {`;
const replace3 = `export function aplicarAtestados(registros: RegistroRelatorio[], atestados: Atestado[], funcionarios: Funcionario[], filtro: Filtro = {}, feriados: string[] = []): RegistroRelatorio[] {`;
content = content.replace(target3, replace3);

const target4 = `    for (const data of diasUteisAtestado(certificate.start_date, certificate.end_date)) {`;
const replace4 = `    for (const data of diasUteisAtestado(certificate.start_date, certificate.end_date, feriados)) {`;
content = content.replace(target4, replace4);

fs.writeFileSync('src/lib/atestados-relatorio.ts', content);
