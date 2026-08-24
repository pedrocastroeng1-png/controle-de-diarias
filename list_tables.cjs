const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('auditoria').select('*').limit(1);
  console.log('auditoria:', error ? error.message : 'exists');
  const { data: d2, error: e2 } = await supabase.from('audit_logs').select('*').limit(1);
  console.log('audit_logs:', e2 ? e2.message : 'exists');
  const { data: d3, error: e3 } = await supabase.from('logs').select('*').limit(1);
  console.log('logs:', e3 ? e3.message : 'exists');
  const { data: d4, error: e4 } = await supabase.from('platform_audit_logs').select('*').limit(1);
  console.log('platform_audit_logs:', e4 ? e4.message : 'exists');
}
run();
