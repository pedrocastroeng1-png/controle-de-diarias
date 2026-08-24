const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const log = [];
  const p = (msg) => { console.log(msg); log.push(msg); };

  // 1. ANTES DO TESTE
  const getCounts = async () => {
    const counts = {};
    for (const table of ['empresas', 'funcionarios', 'obras', 'presencas', 'ferramentas', 'planos', 'assinaturas']) {
      const { count } = await s.from(table).select('*', { count: 'exact', head: true });
      counts[table] = count;
    }
    return counts;
  };

  const beforeCounts = await getCounts();
  p('--- ANTES ---');
  p(JSON.stringify(beforeCounts));

  const originalEmpresaId = '3d510769-b94c-40fa-a96e-f29939d35c89';
  const { data: originalBefore } = await s.from('empresas').select('*').eq('id', originalEmpresaId).single();
  p('Original Empresa Ativa: ' + originalBefore.ativo);

  // 2. TESTE - Criar empresa
  const { data: planos } = await s.from('planos').select('*').limit(1);
  const plano = planos[0];

  const { data: novaEmpresa, error: empErr } = await s.from('empresas').insert({
    nome: 'EMPRESA TESTE OWNER',
    ativo: true,
    status: 'ACTIVE'
  }).select().single();

  if (empErr) {
    p('ERRO AO CRIAR EMPRESA: ' + empErr.message);
    // if RLS error, try to bypass or report
    return;
  }

  p('Empresa Teste ID: ' + novaEmpresa.id);

  // 2.1 Criar assinatura
  const { data: novaAssinatura, error: assErr } = await s.from('assinaturas').insert({
    empresa_id: novaEmpresa.id,
    plano_id: plano.id,
    status: 'ACTIVE',
    valor_mensal: plano.valor_mensal,
    started_at: new Date().toISOString(),
    current_period_start: new Date().toISOString().split('T')[0],
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_legacy: false
  }).select().single();

  if (assErr) {
    p('ERRO AO CRIAR ASSINATURA: ' + assErr.message);
  } else {
    p('Assinatura Teste ID: ' + novaAssinatura.id);
  }

  // 3. VALIDAR COUNTS DEPOIS
  const afterCounts = await getCounts();
  p('--- DEPOIS ---');
  p(JSON.stringify(afterCounts));

  // 4. TESTE DE STATUS
  await s.from('empresas').update({ ativo: false, status: 'INACTIVE' }).eq('id', novaEmpresa.id);
  const { data: empInativa } = await s.from('empresas').select('ativo, status').eq('id', novaEmpresa.id).single();
  p(`Status Inativa: ativo=${empInativa.ativo}, status=${empInativa.status}`);

  await s.from('empresas').update({ ativo: true, status: 'ACTIVE' }).eq('id', novaEmpresa.id);
  const { data: empAtiva } = await s.from('empresas').select('ativo, status').eq('id', novaEmpresa.id).single();
  p(`Status Ativa: ativo=${empAtiva.ativo}, status=${empAtiva.status}`);

  // 5. TESTE DA EMPRESA ORIGINAL
  const { data: originalAfter } = await s.from('empresas').select('*').eq('id', originalEmpresaId).single();
  p('Original Empresa (Depois) Ativa: ' + originalAfter.ativo);
  p('Original Intacta: ' + (JSON.stringify(originalBefore) === JSON.stringify(originalAfter)));
}

run();
