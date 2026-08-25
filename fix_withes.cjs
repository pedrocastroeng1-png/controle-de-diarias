const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// The best way to fix this safely is to look for all `withEmpresa` usages and manually fix them in an editor or replace them using precise string replacement.

code = code.replace(
  `    const { data, error } = await withEmpresa(
      supabase.from("medical_certificates"),
    ).select("*, funcionario:funcionarios(*)");`,
  `    const { data, error } = await withEmpresa(
      supabase.from("medical_certificates").select("*, funcionario:funcionarios(*)")
    );`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(
      supabase.from("medical_certificates"),
    )
      .select("*, funcionario:funcionarios(*)")
      .lte("start_date", dateStr)
      .gte("end_date", dateStr);`,
  `    const { data, error } = await withEmpresa(
      supabase.from("medical_certificates").select("*, funcionario:funcionarios(*)")
    )
      .lte("start_date", dateStr)
      .gte("end_date", dateStr);`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(supabase.from("ferramentas"))
      .select("*")
      .order("nome", { ascending: true });`,
  `    const { data, error } = await withEmpresa(supabase.from("ferramentas").select("*"))
      .order("nome", { ascending: true });`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(supabase.from("funcionarios"))
      .select("*, funcao:funcoes(*), obra:obras(*)")
      .order("nome", { ascending: true });`,
  `    const { data, error } = await withEmpresa(supabase.from("funcionarios").select("*, funcao:funcoes(*), obra:obras(*)"))
      .order("nome", { ascending: true });`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(supabase.from("funcionarios"))
      .select("*, funcao:funcoes(*), obra:obras(*)")
      .eq("ativo", true)
      .order("nome", { ascending: true });`,
  `    const { data, error } = await withEmpresa(supabase.from("funcionarios").select("*, funcao:funcoes(*), obra:obras(*)"))
      .eq("ativo", true)
      .order("nome", { ascending: true });`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(supabase.from("usuarios"))
      .select("id, usuario, perfil")
      .in("perfil", ["OPERADOR", "ADMIN", "CONSULTA"])
      .order("usuario", { ascending: true });`,
  `    const { data, error } = await withEmpresa(supabase.from("usuarios").select("id, usuario, perfil"))
      .in("perfil", ["OPERADOR", "ADMIN", "CONSULTA"])
      .order("usuario", { ascending: true });`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(supabase.from("obras"))
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });`,
  `    const { data, error } = await withEmpresa(supabase.from("obras").select("*"))
      .eq("ativo", true)
      .order("nome", { ascending: true });`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(supabase.from("funcoes"))
      .select("*")
      .order("nome", { ascending: true });`,
  `    const { data, error } = await withEmpresa(supabase.from("funcoes").select("*"))
      .order("nome", { ascending: true });`
);

code = code.replace(
  `    const { data, error } = await withEmpresa(supabase.from("communications"))
      .update(payload)
      .eq("id", id)
      .select()
      .single();`,
  `    const { data, error } = await withEmpresa(supabase.from("communications").update(payload))
      .eq("id", id)
      .select()
      .single();`
);

fs.writeFileSync('src/lib/api.ts', code);
