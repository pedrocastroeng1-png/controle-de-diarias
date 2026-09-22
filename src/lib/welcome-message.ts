import type { UsuarioDetalhado } from './types';

export type WelcomeUser = Pick<UsuarioDetalhado, 'nome' | 'usuario' | 'perfil'> &
  Partial<Pick<UsuarioDetalhado, 'login' | 'email' | 'telefone' | 'modo_permissoes' | 'permissoes'>>;

const oneLine = (value: string) => value.replace(/[\r\n*_~`]/g, ' ').trim();

export function buildWelcomeMessage(user: WelcomeUser, siteUrl: string): string {
  const url = new URL(siteUrl);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Link do sistema inválido.');
  // Only the origin is shared: never include query strings, tokens or private routes.
  const allowed = (permission: string) => user.perfil !== 'CONSULTA' &&
    (user.modo_permissoes !== 'PERSONALIZADO' || user.permissoes?.includes(permission));
  const sections = [
    `Olá, *${oneLine(user.nome || user.login || user.usuario)}*! 👋\n*Bem-vindo ao PCEG!*\n\nSeu acesso foi criado. Utilize as funções liberadas para seu perfil e suas obras.`,
    `🔗 *Acesse:* ${url.origin}/\n👤 *Login:* ${oneLine(user.login || user.usuario)}${user.email ? `\n📧 *E-mail cadastrado:* ${oneLine(user.email)}` : ''}\nUse a senha inicial fornecida pelo administrador.`,
    `📲 *INSTALAR NO ANDROID*\n1. Copie o link acima e abra no Google Chrome.\n2. Toque nos três pontinhos ⋮.\n3. Procure “Adicionar à tela inicial” ou “Instalar aplicativo”.\n4. Confirme a instalação.`,
    `🍎 *INSTALAR NO IPHONE*\n1. Copie o link acima e abra no Safari.\n2. Toque em Compartilhar (quadrado com seta para cima; pode estar dentro do menu).\n3. Escolha “Adicionar à Tela de Início”.\n4. Se aparecer “Abrir como App da Web”, deixe ativado.\n5. Toque em Adicionar.\n\nDepois, abra o PCEG pelo ícone no celular e faça login. Os nomes das opções podem variar conforme a versão do navegador. Use conexão com a internet para registrar os dados.`,
  ];
  if (allowed('PRESENCAS_REGISTRAR')) sections.push(
    `📅 *REGISTRAR DIÁRIAS*\n• Abra Presença / Diárias e confira a data e a obra.\n• Marque presente ou ausente para cada funcionário.\n• Revise, toque em Salvar Presença e confirme em Salvar.\n• Quando necessário, use a ação Meia Diária no registro do funcionário e confira o resultado.\n• Aguarde a confirmação de salvamento.\n\nEsses registros são usados para calcular as diárias. Confira antes de confirmar. Não é necessário tirar foto de presença.`);
  if (allowed('MATERIAIS_GERENCIAR')) sections.push(
    `🧱 *REGISTRAR MATERIAIS*\n• Abra Materiais → Entradas (Compras) → Nova Compra.\n• Informe a data, o fornecedor e os demais dados solicitados.\n• Adicione os produtos e confira quantidade, unidade e valor unitário.\n• Confira a obra de destino de cada item, revise o total e toque em Salvar Compra.\n\nExemplo: 12 metros de tubo = quantidade 12, unidade M e preço de cada metro. Não informe o total da compra como preço unitário.\n\n🦺 *EPI:* informe os funcionários que receberão os equipamentos e confira a obra de cada entrega, inclusive quando forem de obras diferentes.`);
  if (allowed('FERRAMENTAS_OPERAR')) sections.push(
    `🛠️ *FERRAMENTAS*\n• Abra Ferramentas e localize o equipamento.\n• Para entregar, use Emprestar, selecione o funcionário e confirme o empréstimo.\n• Quando voltar, localize o empréstimo na aba Emprestadas e use Devolver.\n• Informe a condição de devolução e as observações solicitadas; confirme.\n• Aguarde a confirmação para manter o controle atualizado.`);
  if (user.perfil === 'CONSULTA') sections.push('Seu perfil é de consulta. Você poderá visualizar as informações liberadas, sem registrar diárias, compras ou empréstimos.');
  sections.push('✅ *ANTES DE ENCERRAR*\nConfira se os lançamentos foram salvos. Se ocorrer um erro ou alguma opção não estiver disponível, fale com o administrador.\n\nBom trabalho e seja bem-vindo à equipe! 🤝');
  return sections.join('\n\n');
}
