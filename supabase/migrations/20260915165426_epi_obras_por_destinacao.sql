-- Preserve the original single-worksite RPC signature and purchase history.
ALTER TABLE public.compras_materiais ALTER COLUMN obra_id DROP NOT NULL;
ALTER TABLE public.compras_materiais_itens ADD COLUMN obra_destino_id uuid REFERENCES public.obras(id) ON DELETE RESTRICT;
CREATE INDEX compras_itens_obra_destino_idx ON public.compras_materiais_itens(obra_destino_id);
COMMENT ON COLUMN public.compras_materiais_itens.obra_destino_id IS 'Obra na data da compra. Legado usa a obra do cabeçalho; nunca a obra atual do funcionário.';
CREATE OR REPLACE FUNCTION public.registrar_compra_material(p_empresa_id uuid, p_usuario_id uuid, p_obra_id uuid, p_fornecedor_id uuid, p_data_compra date DEFAULT NULL::date, p_numero_recibo text DEFAULT NULL::text, p_itens jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_compra_id uuid;
  v_perfil text;
  v_data date;
  v_item jsonb;
  v_material_id uuid;
  v_qtd numeric;
  v_valor numeric;
  v_funcionario_id uuid;
  v_fornecedor_empresa uuid;
  v_obra_empresa uuid;
  v_material_empresa uuid;
  v_material_categoria uuid;
  v_funcionario_empresa uuid;
  v_funcionario_obra uuid;
  v_is_epi boolean;
  v_obra_item uuid;
BEGIN
  IF p_empresa_id IS NULL OR p_usuario_id IS NULL OR p_fornecedor_id IS NULL THEN
    RAISE EXCEPTION 'Empresa, usuário, obra e fornecedor são obrigatórios';
  END IF;

  SELECT u.perfil INTO v_perfil
  FROM public.usuarios u
  WHERE u.id = p_usuario_id
    AND u.empresa_id = p_empresa_id
    AND u.ativo = true;

  IF v_perfil IS NULL OR v_perfil NOT IN ('ADMIN','OPERADOR') THEN
    RAISE EXCEPTION 'Usuário sem permissão para registrar compra';
  END IF;

  IF v_perfil = 'ADMIN' AND p_data_compra IS NOT NULL THEN
    v_data := p_data_compra;
  ELSE
    v_data := current_date;
  END IF;

  SELECT o.empresa_id INTO v_obra_empresa
  FROM public.obras o WHERE o.id = p_obra_id;
  IF p_obra_id IS NOT NULL AND (v_obra_empresa IS NULL OR v_obra_empresa <> p_empresa_id) THEN
    RAISE EXCEPTION 'Obra não pertence à empresa informada';
  END IF;

  SELECT f.empresa_id INTO v_fornecedor_empresa
  FROM public.fornecedores f
  WHERE f.id = p_fornecedor_id AND f.ativo = true;
  IF v_fornecedor_empresa IS NULL OR v_fornecedor_empresa <> p_empresa_id THEN
    RAISE EXCEPTION 'Fornecedor não pertence à empresa informada ou está inativo';
  END IF;

  IF jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'A compra precisa ter pelo menos um item';
  END IF;

  INSERT INTO public.compras_materiais (
    obra_id, data_compra, fornecedor, fornecedor_id, numero_recibo,
    registrado_por, registrado_em, empresa_id
  )
  SELECT
    p_obra_id, v_data,
    f.nome, p_fornecedor_id, NULLIF(btrim(p_numero_recibo), ''),
    p_usuario_id, now(), p_empresa_id
  FROM public.fornecedores f
  WHERE f.id = p_fornecedor_id
  RETURNING id INTO v_compra_id;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_itens)
  LOOP
    v_material_id := NULLIF(v_item->>'material_id','')::uuid;
    v_qtd := NULLIF(v_item->>'quantidade','')::numeric;
    v_valor := COALESCE(NULLIF(v_item->>'valor_unitario','')::numeric, 0);
    v_obra_item := COALESCE(NULLIF(v_item->>'obra_destino_id','')::uuid,p_obra_id);
    IF v_obra_item IS NULL OR NOT EXISTS (SELECT 1 FROM public.obras WHERE id=v_obra_item AND empresa_id=p_empresa_id) THEN
      RAISE EXCEPTION 'Selecione uma obra válida para cada destinação';
    END IF;
    v_funcionario_id := NULLIF(v_item->>'funcionario_id','')::uuid;

    IF v_material_id IS NULL OR v_qtd IS NULL OR v_qtd <= 0 OR v_valor < 0 THEN
      RAISE EXCEPTION 'Item de compra inválido';
    END IF;

    SELECT m.empresa_id, m.categoria_id INTO v_material_empresa, v_material_categoria
    FROM public.materiais m
    WHERE m.id = v_material_id AND m.ativo = true;

    IF v_material_empresa IS NULL OR v_material_empresa <> p_empresa_id THEN
      RAISE EXCEPTION 'Material não pertence à empresa informada ou está inativo';
    END IF;

    SELECT (lower(btrim(mc.nome)) = 'epi') INTO v_is_epi
    FROM public.material_categories mc
    WHERE mc.id = v_material_categoria
      AND mc.empresa_id = p_empresa_id;
    v_is_epi := COALESCE(v_is_epi, false);

    IF NOT v_is_epi AND (p_obra_id IS NULL OR v_obra_item IS DISTINCT FROM p_obra_id) THEN
      RAISE EXCEPTION 'Distribuição entre obras permitida somente para EPI';
    END IF;
    IF p_obra_id IS NOT NULL AND v_obra_item IS DISTINCT FROM p_obra_id THEN
      RAISE EXCEPTION 'Selecione o modo de várias obras para distribuir EPIs';
    END IF;
    IF v_is_epi AND v_funcionario_id IS NULL THEN
      RAISE EXCEPTION 'Para materiais da categoria EPI, o funcionário é obrigatório';
    END IF;

    IF NOT v_is_epi AND v_funcionario_id IS NOT NULL THEN
      RAISE EXCEPTION 'Funcionário só pode ser informado para materiais da categoria EPI';
    END IF;

    IF v_funcionario_id IS NOT NULL THEN
      SELECT f.empresa_id, f.obra_id
      INTO v_funcionario_empresa, v_funcionario_obra
      FROM public.funcionarios f
      WHERE f.id = v_funcionario_id
        AND f.ativo = true;

      IF v_funcionario_empresa IS NULL OR v_funcionario_empresa <> p_empresa_id THEN
        RAISE EXCEPTION 'Funcionário não pertence à empresa informada ou está inativo';
      END IF;

      IF v_funcionario_obra IS DISTINCT FROM v_obra_item THEN
        RAISE EXCEPTION 'O funcionário selecionado não pertence à obra da compra';
      END IF;
    END IF;

    INSERT INTO public.compras_materiais_itens (
      compra_id, material_id, quantidade, valor_unitario, funcionario_id, empresa_id, unidade_compra, obra_destino_id
    ) VALUES (
      v_compra_id, v_material_id, v_qtd, v_valor, v_funcionario_id, p_empresa_id, NULLIF(v_item->>'unidade_compra',''), v_obra_item
    );
  END LOOP;

  RETURN v_compra_id;
EXCEPTION
  WHEN OTHERS THEN
    -- The whole RPC is transactional; this explicit cleanup is retained for compatibility
    -- with the existing implementation, but any raised exception still rolls back the call.
    IF v_compra_id IS NOT NULL THEN
      DELETE FROM public.compras_materiais WHERE id = v_compra_id;
    END IF;
    RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_compra_material_to_estoque()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_compra public.compras_materiais%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.material_movimentacoes WHERE compra_item_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT * INTO v_compra FROM public.compras_materiais WHERE id = NEW.compra_id;
  IF v_compra.id IS NULL THEN
    RAISE EXCEPTION 'Compra % não encontrada', NEW.compra_id;
  END IF;

  NEW.empresa_id := v_compra.empresa_id;

  INSERT INTO public.material_movimentacoes (
    empresa_id, material_id, obra_id, tipo, quantidade, data_movimento,
    compra_item_id, valor_unitario, observacao, registrado_por, unidade_movimento, unidade_catalogo_legado
  ) VALUES (
    v_compra.empresa_id, NEW.material_id, COALESCE(NEW.obra_destino_id,v_compra.obra_id), 'ENTRADA', NEW.quantidade,
    v_compra.data_compra, NEW.id, COALESCE(NEW.valor_unitario,0),
    COALESCE('Entrada automática da compra ' || COALESCE(v_compra.numero_recibo,''), 'Entrada automática da compra'),
    v_compra.registrado_por, NEW.unidade_compra, NEW.unidade_catalogo_legado
  )
  ON CONFLICT (compra_item_id) DO UPDATE SET
    empresa_id = EXCLUDED.empresa_id,
    material_id = EXCLUDED.material_id,
    obra_id = EXCLUDED.obra_id,
    quantidade = EXCLUDED.quantidade,
    data_movimento = EXCLUDED.data_movimento,
    valor_unitario = EXCLUDED.valor_unitario,
    observacao = EXCLUDED.observacao,
    registrado_por = EXCLUDED.registrado_por,
    unidade_movimento = EXCLUDED.unidade_movimento,
    unidade_catalogo_legado = EXCLUDED.unidade_catalogo_legado,
    updated_at = now();

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE VIEW public.vw_relatorio_compras_materiais AS  SELECT c.id AS compra_id,
    c.empresa_id,
    c.data_compra,
    COALESCE(i.obra_destino_id, c.obra_id) AS obra_id,
    o.nome AS obra,
    o.parent_obra_id,
    COALESCE(po.id, o.id) AS obra_principal_id,
    COALESCE(po.nome, o.nome) AS obra_principal,
    c.fornecedor,
    c.numero_recibo,
    c.observacao AS observacao_compra,
    i.id AS item_id,
    i.material_id,
    m.nome AS material,
    COALESCE(i.unidade_compra, i.unidade_catalogo_legado) AS unidade,
    mc.id AS categoria_id,
    mc.nome AS categoria,
    i.quantidade,
    i.valor_unitario,
    COALESCE(i.valor_total, (i.quantidade * i.valor_unitario)) AS valor_total,
    i.funcionario_id,
    f.nome AS funcionario_destinatario,
    c.registrado_por,
    u.nome AS registrado_por_nome,
    (i.unidade_compra IS NOT NULL) AS unidade_confirmada
   FROM (((((((compras_materiais c
     JOIN compras_materiais_itens i ON ((i.compra_id = c.id)))
     JOIN obras o ON ((o.id = COALESCE(i.obra_destino_id, c.obra_id))))
     LEFT JOIN obras po ON ((po.id = o.parent_obra_id)))
     JOIN materiais m ON ((m.id = i.material_id)))
     JOIN material_categories mc ON ((mc.id = m.categoria_id)))
     LEFT JOIN funcionarios f ON ((f.id = i.funcionario_id)))
     LEFT JOIN usuarios u ON ((u.id = c.registrado_por)));

CREATE OR REPLACE FUNCTION pceg_private.validar_destino_epi() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public.compras_materiais%ROWTYPE; epi boolean;
BEGIN
 SELECT * INTO c FROM public.compras_materiais WHERE id=NEW.compra_id;
 IF c.id IS NULL OR NEW.empresa_id IS DISTINCT FROM c.empresa_id THEN RAISE EXCEPTION 'Compra e item devem pertencer à mesma empresa'; END IF;
 NEW.obra_destino_id := COALESCE(NEW.obra_destino_id,c.obra_id);
 IF NEW.obra_destino_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.obras WHERE id=NEW.obra_destino_id AND empresa_id=c.empresa_id) THEN RAISE EXCEPTION 'Obra de destino inválida'; END IF;
 SELECT lower(trim(cat.nome))='epi' INTO epi FROM public.materiais m JOIN public.material_categories cat ON cat.id=m.categoria_id WHERE m.id=NEW.material_id AND m.empresa_id=c.empresa_id;
 IF epi IS NULL THEN RAISE EXCEPTION 'Material inválido'; END IF;
 IF c.obra_id IS NULL AND NOT epi THEN RAISE EXCEPTION 'Distribuição entre obras permitida somente para EPI'; END IF;
 IF c.obra_id IS NOT NULL AND NEW.obra_destino_id IS DISTINCT FROM c.obra_id THEN RAISE EXCEPTION 'Destino diferente da obra da compra'; END IF;
 IF epi AND NOT EXISTS(SELECT 1 FROM public.funcionarios WHERE id=NEW.funcionario_id AND empresa_id=c.empresa_id AND ativo AND obra_id=NEW.obra_destino_id) THEN RAISE EXCEPTION 'Funcionário deve estar ativo e pertencer à obra de destino'; END IF;
 IF NOT epi AND NEW.funcionario_id IS NOT NULL THEN RAISE EXCEPTION 'Funcionário permitido somente para EPI'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pceg_private.validar_destino_epi() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validar_destino_epi BEFORE INSERT OR UPDATE OF obra_destino_id,compra_id,material_id,funcionario_id,empresa_id ON public.compras_materiais_itens FOR EACH ROW EXECUTE FUNCTION pceg_private.validar_destino_epi();

