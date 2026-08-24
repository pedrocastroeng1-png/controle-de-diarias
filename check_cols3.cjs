const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const checkCol = async (col) => {
    const { error } = await s.from('platform_updates').select(col).limit(1);
    console.log(col, error ? 'no' : 'YES');
  };
  const candidates = [
    'description', 'notes', 'type', 'status', 'mandatory', 'is_mandatory', 'content', 'body', 'author_id', 'owner_id'
  ];
  for (const c of candidates) await checkCol(c);
}
run();
