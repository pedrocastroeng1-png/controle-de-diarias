const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

// We will use regex to find `await withEmpresa(` and remove `await `, then add it before the whole expression by wrapping it.
// Actually, `await withEmpresa(X).foo()` -> `await (withEmpresa(X) as any).foo()` ? No, `await` binds loosely.
// `(await withEmpresa(X)).foo()` is what it's currently doing.
// We want `await (withEmpresa(X).foo())`.
// If we replace `await withEmpresa` with `await (withEmpresa` ... wait, we don't know where the chain ends!

// Let's do string replacement for the specific blocks.

const replacements = [
  {
    from: `    const { data, error } = await withEmpresa(supabase.from("communications")).update(payload)
      .eq("id", id)
      .select()
      .single();`,
    to: `    let query = withEmpresa(supabase.from("communications")).update(payload);
    const { data, error } = await query.eq("id", id).select().single();`
  },
  {
    from: `    const { data, error } = await withEmpresa(supabase.from("usuarios")).select("id, usuario, perfil")
      .in("perfil", ["OPERADOR", "ADMIN", "CONSULTA"])
      .eq("ativo", true);`,
    to: `    let query = withEmpresa(supabase.from("usuarios")).select("id, usuario, perfil");
    const { data, error } = await query.in("perfil", ["OPERADOR", "ADMIN", "CONSULTA"]).eq("ativo", true);`
  },
  {
    from: `    const { error } = await withEmpresa(supabase.from("presencas")).delete()
      .eq("funcionario_id", funcionario_id)
      .eq("data", data);`,
    to: `    let query = withEmpresa(supabase.from("presencas")).delete();
    const { error } = await query.eq("funcionario_id", funcionario_id).eq("data", data);`
  },
  {
    from: `    const { data, error } = await withEmpresa(supabase.from("presencas")).select(
        \`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))\`,
      )
      .eq("funcionario_id", funcionario_id)
      .not("photo_path", "is", null)
      .gte("data", dataLimite)
      .order("data", { ascending: false });`,
    to: `    let query = withEmpresa(supabase.from("presencas")).select(
        \`*, funcionario:funcionarios!inner(*, funcao:funcoes(*), obra:obras(*))\`,
      );
    const { data, error } = await query.eq("funcionario_id", funcionario_id)
      .not("photo_path", "is", null)
      .gte("data", dataLimite)
      .order("data", { ascending: false });`
  },
  {
    from: `      const { data: operators } = await withEmpresa(supabase.from("usuarios")).select("id")
        .eq("perfil", "OPERADOR");`,
    to: `      let query = withEmpresa(supabase.from("usuarios")).select("id");
      const { data: operators } = await query.eq("perfil", "OPERADOR");`
  },
  {
    from: `    const { data, error } = await withEmpresa(
      supabase.from("medical_certificates").update(atestado),
    )
      .eq("id", id)
      .select()
      .single();`,
    to: `    let query = withEmpresa(supabase.from("medical_certificates").update(atestado));
    const { data, error } = await query.eq("id", id).select().single();`
  },
  {
    from: `    const { error } = await withEmpresa(
      supabase.from("medical_certificates").delete(),
    ).eq("id", id);`,
    to: `    let query = withEmpresa(supabase.from("medical_certificates").delete());
    const { error } = await query.eq("id", id);`
  },
  {
    from: `    const { data, error } = await withEmpresa(
      supabase.from("medical_certificates").select("*, funcionario:funcionarios(*)")
    )
      .lte("start_date", dateStr)
      .gte("end_date", dateStr);`,
    to: `    let query = withEmpresa(supabase.from("medical_certificates").select("*, funcionario:funcionarios(*)"));
    const { data, error } = await query.lte("start_date", dateStr).gte("end_date", dateStr);`
  },
  {
    from: `    const { data, error } = await withEmpresa(supabase.from("ferramentas")).select("*")
      .order("nome", { ascending: true });`,
    to: `    let query = withEmpresa(supabase.from("ferramentas")).select("*");
    const { data, error } = await query.order("nome", { ascending: true });`
  },
  {
    from: `    const { data, error } = await withEmpresa(supabase.from("ferramentas")).select("*")
      .eq("id", id)
      .single();`,
    to: `    let query = withEmpresa(supabase.from("ferramentas")).select("*");
    const { data, error } = await query.eq("id", id).single();`
  },
  {
    from: `    const { data, error } = await withEmpresa(supabase.from("materiais")).select("*, category:material_categories(*)")
      .order("nome");`,
    to: `    let query = withEmpresa(supabase.from("materiais")).select("*, category:material_categories(*)");
    const { data, error } = await query.order("nome");`
  },
  {
    from: `        await withEmpresa(supabase.from("compras_materiais")).delete().eq(
          "id",
          compra.id,
        );`,
    to: `        let query = withEmpresa(supabase.from("compras_materiais")).delete();
        await query.eq("id", compra.id);`
  },
  {
    from: `    const { data: funcData } = await withEmpresa(
      supabase.from("funcionarios").select("nome"),
    )
      .eq("id", funcionario_id)
      .single();`,
    to: `    let queryFunc = withEmpresa(supabase.from("funcionarios").select("nome"));
    const { data: funcData } = await queryFunc.eq("id", funcionario_id).single();`
  },
  {
    from: `    const { data: obraData } = await withEmpresa(
      supabase.from("obras").select("nome"),
    )
      .eq("id", obra_id)
      .single();`,
    to: `    let queryObra = withEmpresa(supabase.from("obras").select("nome"));
    const { data: obraData } = await queryObra.eq("id", obra_id).single();`
  },
  {
    from: `    const { error: updError } = await withEmpresa(
      supabase.from("ferramentas").update({ status: "ATIVA" }),
    ).eq("id", ferramenta_id);`,
    to: `    let queryFer = withEmpresa(supabase.from("ferramentas").update({ status: "ATIVA" }));
    const { error: updError } = await queryFer.eq("id", ferramenta_id);`
  }
];

for (const r of replacements) {
  if (!code.includes(r.from)) {
    console.log("NOT FOUND:\n" + r.from + "\n---");
  }
  code = code.replace(r.from, r.to);
}

fs.writeFileSync('src/lib/api.ts', code);
