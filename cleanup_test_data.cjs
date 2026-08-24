const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const p = console.log;

  const testEmpresas = [
    'f82b6303-e9b2-454d-845a-23259101fb8e',
    '6624e78d-7079-4cc7-b857-433626dfaa2e'
  ];
  
  const testAssinaturas = [
    '6f32e37c-8b95-4d95-ad24-0ec195436e74',
    'f1f44b05-d28a-426c-96c5-7d8cbe1d8670'
  ];

  const originalEmpresaId = '3d510769-b94c-40fa-a96e-f29939d35c89';

  if (testEmpresas.includes(originalEmpresaId)) {
    p("CRITICAL ERROR: Original empresa is in the deletion list.");
    return;
  }

  // 1. Verify signatures belong to test companies
  const { data: assinaturasData } = await s.from('assinaturas').select('id, empresa_id').in('id', testAssinaturas);
  for (const ass of assinaturasData) {
    if (!testEmpresas.includes(ass.empresa_id)) {
      p("CRITICAL ERROR: Assinatura " + ass.id + " belongs to an unknown company " + ass.empresa_id);
      return;
    }
  }

  // 2. Verify test companies have no employees, works, or presences
  for (const empId of testEmpresas) {
    const { count: fCount } = await s.from('funcionarios').select('*', { count: 'exact', head: true }).eq('empresa_id', empId);
    const { count: oCount } = await s.from('obras').select('*', { count: 'exact', head: true }).eq('empresa_id', empId);
    // presencas are linked to obras or funcionarios, but let's check directly if possible or skip.
    if (fCount > 0 || oCount > 0) {
      p("CRITICAL ERROR: Empresa " + empId + " has records. Funcionarios: " + fCount + ", Obras: " + oCount);
      return;
    }
  }

  // Get BEFORE counts
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

  // 4. Remove signatures
  p("Deleting assinaturas...");
  const { error: errAss } = await s.from('assinaturas').delete().in('id', testAssinaturas);
  if (errAss) p("Error deleting assinaturas: " + errAss.message);

  // 5. Remove companies
  p("Deleting empresas...");
  const { error: errEmp } = await s.from('empresas').delete().in('id', testEmpresas);
  if (errEmp) p("Error deleting empresas: " + errEmp.message);

  // 6. AFTER counts
  const afterCounts = await getCounts();
  p('--- DEPOIS ---');
  p(JSON.stringify(afterCounts));

  // Verify original company
  const { data: originalData } = await s.from('empresas').select('id, nome, status, ativo').eq('id', originalEmpresaId).single();
  p('--- ORIGINAL EMPRESA ---');
  p(JSON.stringify(originalData));
}

run();
