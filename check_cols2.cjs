const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const checkCol = async (col) => {
    const { error } = await s.from('platform_updates').select(col).limit(1);
    if (!error) console.log(`Col exists: ${col}`);
  };
  const candidates = [
    'notes', 'release_notes', 'body', 'features', 'fixes',
    'is_published', 'active', 'is_active', 'urgency', 'is_required'
  ];
  for (const c of candidates) await checkCol(c);
}
run();
