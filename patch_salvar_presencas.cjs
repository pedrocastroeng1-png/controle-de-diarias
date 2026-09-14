const fs = require('fs');
let file = 'src/lib/api.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /const empresaIdReal = empresaIdDoUsuario \|\| empresaIdDoPayload;\n\s*if \(\!empresaIdReal\) \{/m;

const injection = `const empresaIdReal = empresaIdDoUsuario || empresaIdDoPayload;
    if (!empresaIdReal) {`;

// We can just add the feriados check before the upsert:
const upsertRegex = /const \{ data, error \} = await withEmpresa\(\n\s*supabase\.from\("presencas"\)\n\s*\.upsert\(\n\s*presencas\.map\(\(p\) => \(\{/m;

const beforeUpsert = `
    // Client-side block for holidays (Server enforces via trigger)
    try {
      const feriados = await api.getFeriados();
      const holidayDates = feriados.map(f => f.data);
      for (const p of presencas) {
        if (holidayDates.includes(p.data) && (p.status === 'PRESENTE' || p.status === 'MEIA_DIARIA' || p.status === 'MEIA DIÁRIA')) {
          throw new Error(\`Feriado registrado em \${p.data.split('-').reverse().join('/')}. Não é possível registrar presença.\`);
        }
      }
    } catch(e: any) {
      if (e.message.includes('Feriado registrado')) throw e;
      // if fetch fails, let backend trigger handle it
    }

    const { data, error } = await withEmpresa(
      supabase.from("presencas")
      .upsert(
        presencas.map((p) => ({`;

content = content.replace(upsertRegex, beforeUpsert);
fs.writeFileSync(file, content);
