import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import type { Funcionario } from './types';
import { valorFinanceiro, type RegistroRelatorio } from './atestados-relatorio';

export type ResumoFuncionario = { integrais: number; meias: number; atestados: number; total: number; inicio: string | null; fim: string | null };
export function resumirFuncionario(funcionario: Funcionario, registros: RegistroRelatorio[]): ResumoFuncionario {
  const resumo: ResumoFuncionario = { integrais: 0, meias: 0, atestados: 0, total: 0, inicio: null, fim: null };
  if (funcionario.tipo_colaborador !== 'DIARISTA') return resumo;
  const seen = new Set<string>();
  let centavos = 0;
  for (const row of registros) {
    if (row.funcionario_id !== funcionario.id) continue;
    if (!row.empresa_id || row.empresa_id !== funcionario.empresa_id) throw new Error('Empresa divergente no histórico do funcionário.');
    if (!row.data || seen.has(row.data)) throw new Error('Histórico com data ausente ou duplicada.');
    seen.add(row.data);
    if (!['PRESENTE', 'ATESTADO MÉDICO', 'MEIA_DIARIA', 'MEIA DIÁRIA'].includes(row.status ?? '')) continue;
    const valor = valorFinanceiro(row);
    if (!Number.isFinite(valor) || valor < 0) throw new Error('Valor inválido no histórico de diárias.');
    if (row.eh_clt || row.tipo_colaborador === 'CLT') continue;
    if (row.status === 'ATESTADO MÉDICO') resumo.atestados++;
    else if (row.percentual_diaria === 50 || row.tipo_diaria === 'MEIA_DIARIA') resumo.meias++;
    else resumo.integrais++;
    centavos += Math.round(valor * 100);
    if (!resumo.inicio || row.data < resumo.inicio) resumo.inicio = row.data;
    if (!resumo.fim || row.data > resumo.fim) resumo.fim = row.data;
  }
  resumo.total = centavos / 100;
  return resumo;
}

const informado = (value?: string | null) => value?.trim() || 'Não informado';
export function dataFicha(value?: string | null, timestamp = false): string {
  if (!value) return 'Não informado';
  if (timestamp) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw new Error('Data de cadastro inválida.');
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Maceio', dateStyle: 'short', timeStyle: 'short' }).format(date);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error('Data cadastral inválida.');
  return value.split('-').reverse().join('/');
}
export function nomeArquivoFuncionario(f: Funcionario): string {
  const nome = f.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'Funcionario';
  if (!/^[a-zA-Z0-9-]+$/.test(f.id)) throw new Error('Identificador de funcionário inválido.');
  return `${nome}_${f.id}.pdf`;
}

export function criarFichaFuncionario(f: Funcionario, resumo: ResumoFuncionario, foto: string | null, emitidoEm = new Date()): ArrayBuffer {
  const doc = new jsPDF({ compress: true });
  doc.setFillColor(20, 48, 70); doc.rect(0, 0, 210, 36, 'F');
  doc.setTextColor(255); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('FICHA DO FUNCIONÁRIO', 16, 17);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('SISTEMA DE DIÁRIAS', 16, 26);
  doc.setTextColor(20, 48, 70); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  const nome = doc.splitTextToSize(f.nome, 130);
  doc.text(nome, 16, 49);
  const nomeFim = 49 + (nome.length - 1) * 6;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`${f.ativo === true ? 'ATIVO' : f.ativo === false ? 'INATIVO' : 'STATUS NÃO INFORMADO'} | ${informado(f.tipo_colaborador)}`, 16, nomeFim + 9);
  if (foto) doc.addImage(foto, 'JPEG', 157, 43, 36, 45);
  else { doc.setDrawColor(210); doc.rect(157, 43, 36, 45); doc.setFontSize(9); doc.text('Sem foto', 175, 66, { align: 'center' }); }
  const rows: string[][] = [
    ['Função atual', informado(f.funcao?.nome)], ['Obra atual', informado(f.obra?.nome)],
    ['Data de cadastro (Maceió)', dataFicha(f.created_at, true)], ['Data de admissão', dataFicha(f.data_admissao)],
  ];
  if (f.ativo === false) rows.push(['Data de desligamento', dataFicha(f.data_desligamento)]);
  rows.push(['Forma de pagamento', informado(f.forma_pagamento)]);
  if (f.forma_pagamento === 'CAIXA ECONOMICA FEDERAL') rows.push(['Agência Caixa', informado(f.agencia)], ['Tipo de conta', informado(f.tipo_conta)], ['Conta', informado(f.conta)]);
  if (f.forma_pagamento === 'PIX') rows.push(['Chave PIX', informado(f.chave_pix)]);
  rows.push(['Observação de pagamento', informado(f.observacao_pagamento)]);
  if (f.tipo_colaborador === 'DIARISTA') {
    rows.push(['Diárias integrais (presenças)', String(resumo.integrais)], ['Meias diárias', String(resumo.meias)], ['Dias de atestado remunerados', String(resumo.atestados)],
      ['Período dos registros remunerados', resumo.inicio ? `${dataFicha(resumo.inicio)} a ${dataFicha(resumo.fim)}` : 'Sem diárias remuneradas registradas'],
      ['Total calculado das diárias', resumo.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })]);
  } else rows.push(['Financeiro', 'Cálculo financeiro de CLT ainda não disponível.']);
  rows.push(['Critério do relatório', f.tipo_colaborador === 'DIARISTA' ? 'Histórico completo disponível no relatório do sistema, respeitando as datas de vínculo. Valores calculados com a função vigente; não comprovam transferência bancária. Atestados: segunda a sexta, sem duplicar presenças. Cada dia consta em uma única categoria.' : 'Ficha cadastral. Módulo financeiro de CLT não implementado.']);
  autoTable(doc, { startY: Math.max(94, nomeFim + 20), margin: { left: 16, right: 16, bottom: 26, top: 18 }, body: rows,
    theme: 'striped', styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.4, overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold', textColor: [20, 48, 70] } },
    rowPageBreak: 'avoid' });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setTextColor(90); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`Cadastro: ${f.id}`, 16, 280);
    doc.text(`Emitido em ${dataFicha(emitidoEm.toISOString(), true)} | ${page}/${pages}`, 16, 286);
  }
  return doc.output('arraybuffer');
}

export async function criarZipFuncionarios(funcionarios: Funcionario[], registros: RegistroRelatorio[], carregarFoto: (f: Funcionario) => Promise<string | null>, progresso: (concluidos: number, total: number) => void = () => {}) {
  if (!funcionarios.length) throw new Error('Selecione pelo menos um funcionário.');
  if (new Set(funcionarios.map(f => f.id)).size !== funcionarios.length) throw new Error('Funcionários duplicados na seleção.');
  const empresa = funcionarios[0].empresa_id;
  if (!empresa || funcionarios.some(f => f.empresa_id !== empresa)) throw new Error('Seleção com empresas divergentes.');
  const zip = new JSZip();
  const emitidoEm = new Date();
  for (const [i, f] of funcionarios.entries()) {
    const resumo = resumirFuncionario(f, registros);
    // A registered photo must load: never silently deliver an incomplete employee record.
    const foto = f.photo_path ? await carregarFoto(f) : null;
    if (f.photo_path && !foto) throw new Error(`Não foi possível carregar a foto de ${f.nome}. Tente novamente.`);
    zip.file(nomeArquivoFuncionario(f), criarFichaFuncionario(f, resumo, foto, emitidoEm));
    progresso(i + 1, funcionarios.length);
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
