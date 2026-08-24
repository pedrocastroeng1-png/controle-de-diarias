const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/Pagamentos.tsx', 'utf8');

const targetFunction = `  const handleGerarPix = async () => {
    setError('');
    setPixResult(null);
    setGerando(true);
    try {
      const ass = assinaturas.find(a => a.empresa_id === selectedEmpresaId);
      const emp = empresas.find(e => e.id === selectedEmpresaId);
      
      if (!ass) {
        throw new Error("Esta empresa não possui uma assinatura configurada.");
      }
      
      // We must find an existing pending payment, as we cannot create one from the frontend
      const pendingPayment = pagamentos.find(p => p.empresa_id === selectedEmpresaId && p.status === 'PENDING');
      
      if (!pendingPayment) {
        throw new Error("Frontend blocker: É necessário uma API backend segura para criar o registro de pagamento em 'platform_payments' antes de gerar a cobrança no Mercado Pago. Não é seguro inserir registros diretamente do frontend.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado.");
      }

      const payload = {
        external_reference: pendingPayment.id,
        title: \`PCEG — \${ass.plano?.nome || 'Plano'}\`,
        amount: ass.plano?.valor_mensal || 0,
        payer_email: emp?.email || 'contato@pceg.com.br',
        expiration_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // +1 day
      };

      const { data, error: fnError } = await supabase.functions.invoke('mercadopago-create-payment-secure', {
        body: payload
      });`;

const newFunction = `  const handleGerarPix = async () => {
    setError('');
    setPixResult(null);
    setGerando(true);
    try {
      const ass = assinaturas.find(a => a.empresa_id === selectedEmpresaId);
      const emp = empresas.find(e => e.id === selectedEmpresaId);
      
      if (!ass) {
        throw new Error("Esta empresa não possui uma assinatura configurada.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado.");
      }
      
      const isOwner = session.user.app_metadata?.platform_role === 'owner';
      if (!isOwner) {
        throw new Error("Acesso restrito ao dono do aplicativo.");
      }

      const payload = {
        empresa_id: selectedEmpresaId,
        plano_id: ass.plano_id,
        assinatura_id: ass.id,
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        payer_email: emp?.email || 'contato@pceg.com.br'
      };

      const { data, error: fnError } = await supabase.functions.invoke('mercadopago-create-payment-secure', {
        body: payload
      });`;

content = content.replace(targetFunction, newFunction);

fs.writeFileSync('src/pages/owner/Pagamentos.tsx', content);
