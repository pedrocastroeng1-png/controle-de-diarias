const fs = require('fs');

let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

// Update getFuncionarios
code = code.replace(/getFuncionarios: async \(status: 'ativos' \| 'inativos' \| 'todos' = 'ativos'\): Promise<Funcionario\[\]> => \{/, `getFuncionarios: async (status: 'ativos' | 'inativos' | 'todos' = 'ativos', apenasDiaristas = false): Promise<Funcionario[]> => {`);

code = code.replace(/if \(status === 'inativos'\) \{\n      query = query\.eq\('ativo', false\);\n    \}/, `if (status === 'inativos') {
      query = query.eq('ativo', false);
    }
    if (apenasDiaristas) {
      query = query.or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');
    }`);

// Update getFuncionariosPorObra
code = code.replace(/getFuncionariosPorObra: async \(obra_id: string\): Promise<Funcionario\[\]> => \{/, `getFuncionariosPorObra: async (obra_id: string, apenasDiaristas = false): Promise<Funcionario[]> => {`);
code = code.replace(/\.eq\('ativo', true\)\n\s*\.order\('nome'\);/, `.eq('ativo', true);
    if (apenasDiaristas) {
      query = query.or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');
    }
    query = query.order('nome');`);
    
// Update getDashboardStats
// We need to change the count of funcionarios to only consider DIARISTA
code = code.replace(/const \{ count: funcionariosCount \} = await supabase\.from\('funcionarios'\)\.select\('\*', \{ count: 'exact', head: true \}\)\.eq\('ativo', true\);/, `const { count: funcionariosCount } = await supabase.from('funcionarios').select('*', { count: 'exact', head: true }).eq('ativo', true).or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');`);

// Update presencasHoje in getDashboardStats
code = code.replace(/const \{ data: presencasHoje, error \} = await supabase\.from\('vw_relatorio_presencas'\)\.select\('status, valor_diaria'\)\.eq\('data', hoje\);[\s\S]*?faltasHoje\+\+;\n\s*\}\n\s*\}\);/, 
`    const { data: presencasHojeData, error } = await supabase.from('presencas').select('presente, funcionario:funcionarios!inner(tipo_colaborador, funcao:funcoes(valor_diaria))').eq('data', hoje).or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null', { referencedTable: 'funcionarios' });
    if (error) throw error;
    let presentesHoje = 0;
    let faltasHoje = 0;
    let valorTotalHoje = 0;
    presencasHojeData?.forEach(p => {
      if (p.presente) {
        presentesHoje++;
        valorTotalHoje += Number((p.funcionario as any)?.funcao?.valor_diaria || 0);
      } else {
        faltasHoje++;
      }
    });`);

// Update getRelatorio to filter DIARISTA
code = code.replace(/const \{ data, error \} = await query;/, `
    let { data, error } = await query;
    if (data) {
       // Since vw_relatorio_presencas might not have tipo_colaborador or inner join properly mapped
       // Let's filter out CLT using getFuncionarios
       const { data: cltData } = await supabase.from('funcionarios').select('nome').eq('tipo_colaborador', 'CLT');
       const cltNames = cltData?.map(f => f.nome) || [];
       data = data.filter(r => !cltNames.includes(r.funcionario));
    }`);

// Update getPresencas to filter DIARISTA
code = code.replace(/getPresencas: async \(data: string, obra_id\?: string\): Promise<Presenca\[\]> => \{/, `getPresencas: async (data: string, obra_id?: string): Promise<Presenca[]> => {`);

code = code.replace(/\.select\(\`\*, funcionario:funcionarios!inner\(\*, funcao:funcoes\(\*\), obra:obras\(\*\)\)\`\)\n\s*\.eq\('data', data\);/, 
`.select(\`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))\`)
      .or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null', { referencedTable: 'funcionarios' })
      .eq('data', data);`);

fs.writeFileSync('src/lib/api.ts', code);
console.log('Fixed api.ts filtering');
