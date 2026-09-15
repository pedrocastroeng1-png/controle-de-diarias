import {
  authorize,
  checkDb,
  fail,
  HttpError,
  uuid,
} from "../../server/session.js";
export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST", "PATCH"].includes(req.method))
    return res.status(405).end();
  try {
    const { db, user } = await authorize(req, req.method !== "GET");
    if (req.method === "GET" && req.query.compra) {
      if (!uuid(req.query.compra)) throw new HttpError(400, "Compra inválida.");
      const { data: compra, error } = await db
        .from("compras_materiais")
        .select(
          "*,obra:obras(nome),fornecedor_rel:fornecedores(nome),registrador:usuarios!registrado_por(usuario)",
        )
        .eq("empresa_id", user.empresa_id)
        .eq("id", req.query.compra)
        .maybeSingle();
      checkDb(error);
      if (!compra) throw new HttpError(404, "Compra não encontrada.");
      const { data: itens, error: ie } = await db
        .from("compras_materiais_itens")
        .select(
          "*,material:materiais(*,category:material_categories(*)),funcionario:funcionarios(nome)",
        )
        .eq("empresa_id", user.empresa_id)
        .eq("compra_id", compra.id);
      checkDb(ie);
      return res
        .status(200)
        .json({
          ...compra,
          itens,
          total_calculado: itens!.reduce(
            (s, i) => s + Number(i.valor_total || 0),
            0,
          ),
        });
    }
    if (req.method === "GET") {
      const all = user.perfil === "ADMIN" && req.query.todos === "true";
      let query = db
        .from("materiais")
        .select("*,category:material_categories(*)")
        .eq("empresa_id", user.empresa_id)
        .order("nome")
        .order("id");
      if (!all) query = query.eq("ativo", true);
      const rows: any[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await query.range(offset, offset + 499);
        checkDb(error);
        rows.push(...data!);
        if (data!.length < 500) break;
      }
      return res.status(200).json(rows);
    }
    const b = req.body || {};
    if (req.method === "PATCH" && !uuid(b.id))
      throw new HttpError(400, "Produto inválido.");
    let values: any;
    if (
      req.method === "PATCH" &&
      Object.keys(b).every((k) => ["id", "ativo"].includes(k)) &&
      typeof b.ativo === "boolean"
    )
      values = { ativo: b.ativo };
    else {
      if (
        typeof b.nome !== "string" ||
        !b.nome.trim() ||
        b.nome.trim().length > 160 ||
        !uuid(b.categoria_id) ||
        typeof b.unidade !== "string" ||
        !Array.isArray(b.unidades_permitidas) ||
        !b.unidades_permitidas.includes(b.unidade) ||
        !b.unidades_permitidas.length ||
        b.unidades_permitidas.some(
          (u: unknown) =>
            typeof u !== "string" || !/^[A-Z0-9²³]{1,12}$/.test(u),
        ) ||
        (b.observacao != null &&
          (typeof b.observacao !== "string" || b.observacao.length > 1000))
      )
        throw new HttpError(
          400,
          "Revise nome, categoria e unidades do produto.",
        );
      const { data: cat, error } = await db
        .from("material_categories")
        .select("id")
        .eq("id", b.categoria_id)
        .eq("empresa_id", user.empresa_id)
        .eq("ativo", true)
        .maybeSingle();
      checkDb(error);
      if (!cat) throw new HttpError(400, "Categoria inválida.");
      values = {
        nome: b.nome.trim(),
        categoria_id: b.categoria_id,
        unidade: b.unidade,
        unidades_permitidas: [...new Set(b.unidades_permitidas)],
        observacao: b.observacao?.trim() || null,
      };
    }
    const query =
      req.method === "POST"
        ? db
            .from("materiais")
            .insert({ ...values, empresa_id: user.empresa_id })
        : db
            .from("materiais")
            .update(values)
            .eq("id", b.id)
            .eq("empresa_id", user.empresa_id);
    const { data, error } = await query.select().maybeSingle();
    checkDb(error);
    if (!data) throw new HttpError(404, "Produto não encontrado.");
    return res.status(req.method === "POST" ? 201 : 200).json(data);
  } catch (e) {
    return fail(res, e);
  }
}
