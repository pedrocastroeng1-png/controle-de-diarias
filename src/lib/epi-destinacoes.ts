export const MAX_DESTINACOES_EPI = 1000;

export function quantidadeEpiValida(quantidade: number) {
  return Number.isSafeInteger(quantidade) && quantidade > 0 && quantidade <= MAX_DESTINACOES_EPI;
}

export function redimensionarDestinacoes(atuais: string[], quantidade: number): string[] {
  if (!quantidadeEpiValida(quantidade)) return atuais;
  return Array.from({ length: quantidade }, (_, index) => atuais[index] || '');
}

export function distribuirItemEpi(
  item: { material_id: string; quantidade: number; valor_unitario: number; unidade_compra: string },
  destinatarios: string[],
  funcionariosPermitidos: ReadonlySet<string>,
) {
  if (!quantidadeEpiValida(item.quantidade))
    throw new Error(`Para EPI, informe uma quantidade inteira entre 1 e ${MAX_DESTINACOES_EPI}. Divida quantidades maiores em mais itens.`);
  if (!Number.isFinite(item.valor_unitario) || item.valor_unitario < 0)
    throw new Error('Informe um valor unitário válido.');
  if (destinatarios.length !== item.quantidade || destinatarios.some(id => !id || !funcionariosPermitidos.has(id)))
    throw new Error('Selecione um funcionário ativo da obra para cada unidade de EPI.');
  // One RPC call saves every destination atomically in the existing purchase schema.
  return destinatarios.map(funcionario_id => ({ ...item, quantidade: 1, funcionario_id }));
}
