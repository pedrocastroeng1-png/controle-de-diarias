const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const trySelect = async (cols) => {
    const { error } = await s.from('platform_audit_logs').select(cols).limit(1);
    console.log(cols, '->', error ? error.message : 'OK');
  };
  
  await trySelect('id');
  await trySelect('created_at');
  await trySelect('user_id');
  await trySelect('acao');
  await trySelect('action');
  await trySelect('modulo');
  await trySelect('module');
  await trySelect('empresa_id');
  await trySelect('descricao');
  await trySelect('description');
  await trySelect('registro_id');
  await trySelect('record_id');
  await trySelect('ip');
}
run();
