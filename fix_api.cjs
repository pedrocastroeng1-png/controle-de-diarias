const fs = require('fs');
let file = 'src/lib/api.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Communication stats[\s\S]*?(?=return {)/;

const newStatsLogic = `    // Communication stats (Secondary - do not block dashboard)
    let totalComms = 0;
    let readComms = 0;
    let totalExpectedReads = 0;
    let numOperators = 0;
    try {
      const { data: communications } = await supabase.from('communications').select('id, target_audience, target_operator_id');
      const { data: recipients } = await supabase.from('communication_recipients').select('communication_id, operator_id, read_at');
      const { data: operators } = await supabase.from('usuarios').select('id').eq('perfil', 'OPERADOR');
      
      totalComms = communications?.length || 0;
      readComms = recipients?.filter(r => r.read_at)?.length || 0;
      numOperators = operators?.length || 0;
      
      if (communications) {
        communications.forEach(c => {
          if (c.target_audience === 'ALL') {
            totalExpectedReads += numOperators;
          } else {
            totalExpectedReads += 1;
          }
        });
      }
    } catch (e) {
      console.warn("Could not load communication stats", e);
    }

    `;

content = content.replace(regex, newStatsLogic);
fs.writeFileSync(file, content);
console.log('Fixed api.ts');
