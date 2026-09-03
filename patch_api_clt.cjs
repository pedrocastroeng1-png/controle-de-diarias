const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

const getFuncionariosOriginal = `  getFuncionarios: async (
    status: "ativos" | "inativos" | "todos" = "ativos",
    apenasDiaristas = false,
  ): Promise<Funcionario[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(
      supabase
        .from("funcionarios")
        .select(\`*, funcao:funcoes(*), obra:obras(*)\`)).order("nome");

    if (status === "ativos") {
      query = query.eq("ativo", true);
    } else if (status === "inativos") {
      query = query.eq("ativo", false);
    }
    if (apenasDiaristas) {
      query = query.or("tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null");
    }

    let { data, error } = await query;
    if (data) {
      // Since vw_relatorio_presencas might not have tipo_colaborador or inner join properly mapped
      // Let's filter out CLT using getFuncionarios
      const { data: cltData } = await withEmpresa(supabase.from("funcionarios").select("nome").eq("tipo_colaborador", "CLT"));
      const cltNames = cltData?.map((f) => f.nome) || [];
      data = data.filter((r) => !cltNames.includes(r.nome));
    }
    if (error) throw error;
    return data as any;
  },`;

const getFuncionariosNovo = `  getFuncionarios: async (
    status: "ativos" | "inativos" | "todos" = "ativos",
    apenasDiaristas = false,
  ): Promise<Funcionario[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(
      supabase
        .from("funcionarios")
        .select(\`*, funcao:funcoes(*), obra:obras(*)\`)).order("nome");

    if (status === "ativos") {
      query = query.eq("ativo", true);
    } else if (status === "inativos") {
      query = query.eq("ativo", false);
    }
    if (apenasDiaristas) {
      query = query.or("tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null");
    }

    let { data, error } = await query;
    
    if (error) throw error;
    return data as any;
  },`;

code = code.replace(getFuncionariosOriginal, getFuncionariosNovo);

const getPresencasOriginal = `  getPresencas: async (data: string, obra_id?: string): Promise<Presenca[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(
      supabase
        .from("presencas")
        .select(
          \`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))\`,
        ),
    )
      .or("tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null", {
        referencedTable: "funcionarios",
      })
      .eq("data", data);

    if (obra_id) {
      query = query.eq("obra_id", obra_id);
    }`;

const getPresencasNovo = `  getPresencas: async (data: string, obra_id?: string): Promise<Presenca[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(
      supabase
        .from("presencas")
        .select(
          \`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))\`,
        ),
    )
      .eq("data", data);

    if (obra_id) {
      query = query.eq("obra_id", obra_id);
    }`;

code = code.replace(getPresencasOriginal, getPresencasNovo);

fs.writeFileSync('src/lib/api.ts', code);
