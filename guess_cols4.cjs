const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const trySelect = async (cols) => {
    const { error } = await s.from('platform_audit_logs').select(cols).limit(1);
    console.log(cols, '->', error ? error.message : 'OK');
  };
  await trySelect('resource');
  await trySelect('resource_id');
  await trySelect('module');
  await trySelect('entity');
  await trySelect('entity_id');
}
run();
