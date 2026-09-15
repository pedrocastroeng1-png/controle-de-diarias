-- API service_role only: authenticated application identity is validated by the server.
CREATE SCHEMA IF NOT EXISTS pceg_private;
REVOKE ALL ON SCHEMA pceg_private FROM PUBLIC, anon, authenticated;
CREATE TABLE pceg_private.feriados_auditoria (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id uuid NOT NULL REFERENCES public.empresas(id),
 usuario_id uuid NOT NULL REFERENCES public.usuarios(id), operacao text NOT NULL,
 feriado jsonb NOT NULL, impacto jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON pceg_private.feriados_auditoria FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA pceg_private TO service_role;
GRANT INSERT,SELECT ON pceg_private.feriados_auditoria TO service_role;

CREATE OR REPLACE FUNCTION pceg_private.bloquear_presenca_feriado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
 IF NEW.presente AND EXISTS(SELECT 1 FROM public.feriados h WHERE h.empresa_id=NEW.empresa_id AND h.data=NEW.data) THEN
  RAISE EXCEPTION 'Feriado — dia não remunerado. Não é permitido registrar presença ou meia diária.';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pceg_private.bloquear_presenca_feriado() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER bloquear_presenca_feriado BEFORE INSERT OR UPDATE OF presente,percentual_diaria,tipo_diaria,data,empresa_id ON public.presencas
FOR EACH ROW EXECUTE FUNCTION pceg_private.bloquear_presenca_feriado();

CREATE OR REPLACE FUNCTION public.gerenciar_feriado_seguro(p_empresa uuid,p_usuario uuid,p_data date,p_descricao text,p_id uuid,p_operacao text,p_confirmar boolean DEFAULT false,p_fingerprint text DEFAULT null)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE v_rows jsonb;v_total numeric;v_days numeric;v_hash text;v_result jsonb;v_holiday public.feriados%ROWTYPE;
BEGIN
 IF p_operacao NOT IN ('create','delete') OR p_data IS NULL OR NOT isfinite(p_data) THEN RAISE EXCEPTION 'Operação ou data inválida';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.usuarios WHERE id=p_usuario AND empresa_id=p_empresa AND ativo AND perfil='ADMIN') THEN RAISE EXCEPTION 'Administrador inválido';END IF;
 -- The same short transaction reads the impact and commits it; lock source tables so attendance,
 -- certificates and current rates cannot change between fingerprint verification and mutation.
 LOCK TABLE public.feriados IN SHARE ROW EXCLUSIVE MODE;
 LOCK TABLE public.presencas,public.medical_certificates,public.funcionarios,public.funcoes,public.obras IN SHARE MODE;
 SELECT * INTO v_holiday FROM public.feriados WHERE empresa_id=p_empresa AND data=p_data;
 IF p_operacao='create' AND v_holiday.id IS NOT NULL THEN RAISE EXCEPTION 'Feriado já cadastrado para esta data';END IF;
 IF p_operacao='delete' AND (v_holiday.id IS NULL OR p_id IS DISTINCT FROM v_holiday.id) THEN RAISE EXCEPTION 'Feriado não encontrado. Atualize a lista';END IF;
 IF p_operacao='create' AND (p_descricao IS NULL OR char_length(btrim(p_descricao)) NOT BETWEEN 1 AND 500) THEN RAISE EXCEPTION 'Descrição obrigatória, até 500 caracteres';END IF;
 WITH eligible AS (
 SELECT f.id,f.nome,o.nome AS obra,fn.valor_diaria,
 CASE WHEN extract(isodow FROM p_data) BETWEEN 1 AND 5
 AND (f.data_admissao IS NULL OR p_data>=f.data_admissao)
 AND (f.data_desligamento IS NULL OR p_data<=f.data_desligamento)
 AND EXISTS(SELECT 1 FROM public.medical_certificates c WHERE c.employee_id=f.id AND c.empresa_id=p_empresa AND p_data BETWEEN c.start_date AND c.end_date)
 THEN 1::numeric WHEN p.presente THEN COALESCE(p.percentual_diaria,CASE WHEN p.tipo_diaria='MEIA_DIARIA' THEN 50 ELSE 100 END)/100::numeric ELSE 0::numeric END AS days
 FROM public.funcionarios f JOIN public.funcoes fn ON fn.id=f.funcao_id
 LEFT JOIN public.presencas p ON p.funcionario_id=f.id AND p.empresa_id=p_empresa AND p.data=p_data
 LEFT JOIN public.obras o ON o.id=COALESCE(p.obra_id,f.obra_id)
 WHERE f.empresa_id=p_empresa AND f.tipo_colaborador='DIARISTA'
 ), paid AS (SELECT id,nome,obra,days,round(valor_diaria*days,2) AS amount FROM eligible WHERE days>0)
 SELECT COALESCE(jsonb_agg(to_jsonb(paid) ORDER BY id),'[]'::jsonb),COALESCE(sum(amount),0),COALESCE(sum(days),0)
 INTO v_rows,v_total,v_days FROM paid;
 v_hash:=md5(jsonb_build_object('empresa',p_empresa,'data',p_data,'descricao',btrim(p_descricao),'operacao',p_operacao,'id',p_id,'employees',v_rows)::text);
 v_result:=jsonb_build_object('employees',v_rows,'affectedCount',jsonb_array_length(v_rows),'days',v_days,'beforeTotal',CASE WHEN p_operacao='create' THEN v_total ELSE 0 END,'afterTotal',CASE WHEN p_operacao='create' THEN 0 ELSE v_total END,'fingerprint',v_hash);
 IF p_confirmar THEN
  IF p_fingerprint IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'Os dados mudaram. Confira novamente o impacto antes de confirmar';END IF;
  IF p_operacao='create' THEN
   INSERT INTO public.feriados(empresa_id,data,descricao) VALUES(p_empresa,p_data,btrim(p_descricao)) RETURNING * INTO v_holiday;
  ELSE DELETE FROM public.feriados WHERE id=v_holiday.id AND empresa_id=p_empresa;END IF;
  INSERT INTO pceg_private.feriados_auditoria(empresa_id,usuario_id,operacao,feriado,impacto) VALUES(p_empresa,p_usuario,p_operacao,to_jsonb(v_holiday),v_result);
 END IF;
 RETURN v_result;
END $$;
REVOKE ALL ON FUNCTION public.gerenciar_feriado_seguro(uuid,uuid,date,text,uuid,text,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gerenciar_feriado_seguro(uuid,uuid,date,text,uuid,text,boolean,text) TO service_role;
NOTIFY pgrst,'reload schema';

CREATE OR REPLACE VIEW public.vw_relatorio_presencas AS  WITH datas AS (
         SELECT DISTINCT p.empresa_id,
            p.data
           FROM presencas p
        UNION SELECT empresa_id,data FROM public.feriados
        ), presencas_reais AS (
         SELECT p.id,
            p.data,
                CASE
                    WHEN EXISTS(SELECT 1 FROM public.feriados h WHERE h.empresa_id=p.empresa_id AND h.data=p.data) THEN 'FERIADO - NÃO REMUNERADO'::text
                    WHEN p.presente THEN 'PRESENTE'::text
                    ELSE 'FALTOU'::text
                END AS status,
            f.nome AS funcionario,
            fn.nome AS funcao,
            fn.valor_diaria,
            f.tipo_colaborador,
            (f.tipo_colaborador = 'CLT'::text) AS eh_clt,
            o.nome AS obra,
            COALESCE(po.nome, o.nome) AS obra_principal,
                CASE
                    WHEN (o.parent_obra_id IS NULL) THEN NULL::uuid
                    ELSE o.id
                END AS subobra_id,
                CASE
                    WHEN (o.parent_obra_id IS NULL) THEN NULL::text
                    ELSE o.nome
                END AS subobra,
            p.tipo_diaria,
            p.percentual_diaria,
                CASE
                    WHEN (f.tipo_colaborador = 'CLT'::text) THEN NULL::numeric
                    WHEN NOT p.presente OR EXISTS(SELECT 1 FROM public.feriados h WHERE h.empresa_id=p.empresa_id AND h.data=p.data) THEN 0::numeric
                    ELSE round(((fn.valor_diaria * p.percentual_diaria) / 100.00), 2)
                END AS valor_calculado,
                CASE
                    WHEN (f.tipo_colaborador = 'CLT'::text) THEN 'PAGAMENTO EM FOLHA-CLT'::text
                    WHEN NOT p.presente OR EXISTS(SELECT 1 FROM public.feriados h WHERE h.empresa_id=p.empresa_id AND h.data=p.data) THEN '0.00'::text
                    ELSE to_char(round(((fn.valor_diaria * p.percentual_diaria) / 100.00), 2), 'FM999999990.00'::text)
                END AS valor_relatorio,
            p.funcionario_id,
            p.obra_id,
            p.empresa_id,
            f.data_admissao,
            f.data_desligamento,
            f.ativo AS funcionario_ativo,
            o.ativo AS obra_ativa
           FROM ((((presencas p
             JOIN funcionarios f ON ((f.id = p.funcionario_id)))
             JOIN funcoes fn ON ((fn.id = f.funcao_id)))
             JOIN obras o ON ((o.id = p.obra_id)))
             LEFT JOIN obras po ON ((po.id = o.parent_obra_id)))
        ), presencas_faltantes AS (
         SELECT NULL::uuid AS id,
            d.data,
            CASE WHEN EXISTS(SELECT 1 FROM public.feriados h WHERE h.empresa_id=f.empresa_id AND h.data=d.data) THEN 'FERIADO - NÃO REMUNERADO'::text ELSE 'FALTOU'::text END AS status,
            f.nome AS funcionario,
            fn.nome AS funcao,
            fn.valor_diaria,
            f.tipo_colaborador,
            (f.tipo_colaborador = 'CLT'::text) AS eh_clt,
            o.nome AS obra,
            COALESCE(po.nome, o.nome) AS obra_principal,
                CASE
                    WHEN (o.parent_obra_id IS NULL) THEN NULL::uuid
                    ELSE o.id
                END AS subobra_id,
                CASE
                    WHEN (o.parent_obra_id IS NULL) THEN NULL::text
                    ELSE o.nome
                END AS subobra,
            'DIARIA'::text AS tipo_diaria,
            (100)::numeric(5,2) AS percentual_diaria,
                CASE
                    WHEN (f.tipo_colaborador = 'CLT'::text) THEN NULL::numeric
                    ELSE (0)::numeric
                END AS valor_calculado,
                CASE
                    WHEN (f.tipo_colaborador = 'CLT'::text) THEN 'PAGAMENTO EM FOLHA-CLT'::text
                    ELSE '0.00'::text
                END AS valor_relatorio,
            f.id AS funcionario_id,
            f.obra_id,
            f.empresa_id,
            f.data_admissao,
            f.data_desligamento,
            f.ativo AS funcionario_ativo,
            o.ativo AS obra_ativa
           FROM ((((datas d
             JOIN funcionarios f ON (((f.empresa_id = d.empresa_id) AND ((f.data_admissao IS NULL) OR (d.data >= f.data_admissao)) AND ((f.data_desligamento IS NULL) OR (d.data <= f.data_desligamento)))))
             JOIN funcoes fn ON ((fn.id = f.funcao_id)))
             JOIN obras o ON ((o.id = f.obra_id)))
             LEFT JOIN obras po ON ((po.id = o.parent_obra_id)))
          WHERE (NOT (EXISTS ( SELECT 1
                   FROM presencas p
                  WHERE ((p.funcionario_id = f.id) AND (p.data = d.data) AND (p.empresa_id = f.empresa_id)))))
        )
 SELECT presencas_reais.id,
    presencas_reais.data,
    presencas_reais.status,
    presencas_reais.funcionario,
    presencas_reais.funcao,
    presencas_reais.valor_diaria,
    presencas_reais.tipo_colaborador,
    presencas_reais.eh_clt,
    presencas_reais.obra,
    presencas_reais.obra_principal,
    presencas_reais.subobra_id,
    presencas_reais.subobra,
    presencas_reais.tipo_diaria,
    presencas_reais.percentual_diaria,
    presencas_reais.valor_calculado,
    presencas_reais.valor_relatorio,
    presencas_reais.funcionario_id,
    presencas_reais.obra_id,
    presencas_reais.empresa_id,
    presencas_reais.data_admissao,
    presencas_reais.data_desligamento,
    presencas_reais.funcionario_ativo,
    presencas_reais.obra_ativa
   FROM presencas_reais
UNION ALL
 SELECT presencas_faltantes.id,
    presencas_faltantes.data,
    presencas_faltantes.status,
    presencas_faltantes.funcionario,
    presencas_faltantes.funcao,
    presencas_faltantes.valor_diaria,
    presencas_faltantes.tipo_colaborador,
    presencas_faltantes.eh_clt,
    presencas_faltantes.obra,
    presencas_faltantes.obra_principal,
    presencas_faltantes.subobra_id,
    presencas_faltantes.subobra,
    presencas_faltantes.tipo_diaria,
    presencas_faltantes.percentual_diaria,
    presencas_faltantes.valor_calculado,
    presencas_faltantes.valor_relatorio,
    presencas_faltantes.funcionario_id,
    presencas_faltantes.obra_id,
    presencas_faltantes.empresa_id,
    presencas_faltantes.data_admissao,
    presencas_faltantes.data_desligamento,
    presencas_faltantes.funcionario_ativo,
    presencas_faltantes.obra_ativa
   FROM presencas_faltantes;

-- Preserve the catalog unit used by legacy reports, without asserting the real purchase unit.
ALTER TABLE public.materiais ADD COLUMN unidades_permitidas text[], ADD COLUMN observacao text;
UPDATE public.materiais SET unidades_permitidas=CASE WHEN unidade='KG' THEN ARRAY['KG','UN'] ELSE ARRAY[unidade] END;
ALTER TABLE public.materiais ALTER COLUMN unidades_permitidas SET NOT NULL;
ALTER TABLE public.materiais ADD CONSTRAINT materiais_unidades_validas CHECK(cardinality(unidades_permitidas)>0 AND array_position(unidades_permitidas,NULL) IS NULL AND unidade=ANY(unidades_permitidas) AND unidades_permitidas <@ ARRAY['SACO','KG','M','M²','M³','LT','UN','BARRA','PAR','CHAPA','ROLO','CAIXA']);
ALTER TABLE public.materiais ADD CONSTRAINT materiais_observacao_limite CHECK(char_length(observacao)<=1000);
ALTER TABLE public.compras_materiais_itens ADD COLUMN unidade_compra text, ADD COLUMN unidade_catalogo_legado text;
UPDATE public.compras_materiais_itens i SET unidade_catalogo_legado=m.unidade FROM public.materiais m WHERE m.id=i.material_id;
ALTER TABLE public.material_movimentacoes ADD COLUMN unidade_movimento text, ADD COLUMN unidade_catalogo_legado text;
UPDATE public.material_movimentacoes mm SET unidade_catalogo_legado=m.unidade FROM public.materiais m WHERE m.id=mm.material_id;
COMMENT ON COLUMN public.compras_materiais_itens.unidade_catalogo_legado IS 'Unidade do catálogo no momento da migração; não comprova unidade real de compra histórica.';
REVOKE INSERT,UPDATE,DELETE ON public.materiais FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.materiais TO service_role;
CREATE OR REPLACE FUNCTION pceg_private.validar_produto() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.material_categories WHERE id=NEW.categoria_id AND empresa_id=NEW.empresa_id) THEN RAISE EXCEPTION 'Categoria de outra empresa';END IF;
 NEW.nome:=btrim(NEW.nome);
 IF NEW.unidades_permitidas IS NULL THEN NEW.unidades_permitidas:=ARRAY[NEW.unidade];END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pceg_private.validar_produto() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validar_produto BEFORE INSERT OR UPDATE ON public.materiais FOR EACH ROW EXECUTE FUNCTION pceg_private.validar_produto();
CREATE OR REPLACE FUNCTION pceg_private.validar_unidade_compra() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE v_unit text;v_allowed text[];
BEGIN
 SELECT unidade,unidades_permitidas INTO v_unit,v_allowed FROM public.materiais WHERE id=NEW.material_id AND empresa_id=NEW.empresa_id AND ativo;
 IF NOT FOUND THEN RAISE EXCEPTION 'Produto inválido ou inativo';END IF;
 IF TG_OP='INSERT' THEN NEW.unidade_compra:=COALESCE(NULLIF(NEW.unidade_compra,''),v_unit);NEW.unidade_catalogo_legado:=NULL;END IF;
 IF NEW.unidade_compra IS NOT NULL AND NOT (NEW.unidade_compra=ANY(v_allowed)) THEN RAISE EXCEPTION 'Unidade não permitida para este produto';END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pceg_private.validar_unidade_compra() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validar_unidade_compra BEFORE INSERT OR UPDATE OF unidade_compra,material_id,empresa_id ON public.compras_materiais_itens FOR EACH ROW EXECUTE FUNCTION pceg_private.validar_unidade_compra();
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
BEGIN
  IF p_empresa_id IS NULL OR p_usuario_id IS NULL OR p_obra_id IS NULL OR p_fornecedor_id IS NULL THEN
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
  IF v_obra_empresa IS NULL OR v_obra_empresa <> p_empresa_id THEN
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

      IF v_funcionario_obra <> p_obra_id THEN
        RAISE EXCEPTION 'O funcionário selecionado não pertence à obra da compra';
      END IF;
    END IF;

    INSERT INTO public.compras_materiais_itens (
      compra_id, material_id, quantidade, valor_unitario, funcionario_id, empresa_id, unidade_compra
    ) VALUES (
      v_compra_id, v_material_id, v_qtd, v_valor, v_funcionario_id, p_empresa_id, NULLIF(v_item->>'unidade_compra','')
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
$function$
;
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
    v_compra.empresa_id, NEW.material_id, v_compra.obra_id, 'ENTRADA', NEW.quantidade,
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
$function$
;
CREATE OR REPLACE FUNCTION public.validate_material_movimentacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_material_empresa uuid;
  v_obra_empresa uuid;
  v_dest_empresa uuid;
  v_stock numeric;
BEGIN
  SELECT empresa_id INTO v_material_empresa FROM public.materiais WHERE id = NEW.material_id;
  IF v_material_empresa IS NULL OR v_material_empresa <> NEW.empresa_id THEN
    RAISE EXCEPTION 'Material não pertence à empresa informada';
  END IF;

  SELECT empresa_id INTO v_obra_empresa FROM public.obras WHERE id = NEW.obra_id;
  IF v_obra_empresa IS NULL OR v_obra_empresa <> NEW.empresa_id THEN
    RAISE EXCEPTION 'Obra de origem não pertence à empresa informada';
  END IF;

  IF NEW.tipo = 'TRANSFERENCIA' THEN
    SELECT empresa_id INTO v_dest_empresa FROM public.obras WHERE id = NEW.obra_destino_id;
    IF v_dest_empresa IS NULL OR v_dest_empresa <> NEW.empresa_id THEN
      RAISE EXCEPTION 'Obra de destino não pertence à empresa informada';
    END IF;
  END IF;

  IF NEW.compra_item_id IS NULL AND TG_OP='INSERT' THEN
    IF (SELECT cardinality(unidades_permitidas)>1 FROM public.materiais WHERE id=NEW.material_id) THEN
      RAISE EXCEPTION 'Movimentação manual de produto com múltiplas unidades exige seleção de unidade. Utilize o fluxo de compras';
    END IF;
    SELECT unidade INTO NEW.unidade_movimento FROM public.materiais WHERE id=NEW.material_id;
  END IF;
  IF NEW.tipo IN ('SAIDA','PERDA','TRANSFERENCIA','AJUSTE_SAIDA') THEN
    SELECT COALESCE(SUM(
      CASE
        WHEN mm.tipo IN ('ENTRADA','AJUSTE_ENTRADA') THEN mm.quantidade
        WHEN mm.tipo IN ('SAIDA','PERDA','AJUSTE_SAIDA') THEN -mm.quantidade
        WHEN mm.tipo = 'TRANSFERENCIA' THEN -mm.quantidade
        ELSE 0
      END
    ),0)
    INTO v_stock
    FROM public.material_movimentacoes mm
    WHERE mm.empresa_id = NEW.empresa_id
      AND mm.material_id = NEW.material_id
      AND mm.obra_id = NEW.obra_id
      AND COALESCE(mm.unidade_movimento,mm.unidade_catalogo_legado)=COALESCE(NEW.unidade_movimento,NEW.unidade_catalogo_legado)
      AND (TG_OP <> 'UPDATE' OR mm.id <> NEW.id);

    IF v_stock < NEW.quantidade THEN
      RAISE EXCEPTION 'Estoque insuficiente. Saldo atual: %, tentativa de movimentar: %', v_stock, NEW.quantidade;
    END IF;
  END IF;

  IF NEW.registrado_por IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = NEW.registrado_por AND u.empresa_id = NEW.empresa_id
  ) THEN
    RAISE EXCEPTION 'Usuário registrador não pertence à empresa informada';
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE VIEW public.vw_relatorio_compras_materiais AS  SELECT c.id AS compra_id,
    c.empresa_id,
    c.data_compra,
    c.obra_id,
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
    u.nome AS registrado_por_nome, (i.unidade_compra IS NOT NULL) AS unidade_confirmada
   FROM (((((((compras_materiais c
     JOIN compras_materiais_itens i ON ((i.compra_id = c.id)))
     JOIN obras o ON ((o.id = c.obra_id)))
     LEFT JOIN obras po ON ((po.id = o.parent_obra_id)))
     JOIN materiais m ON ((m.id = i.material_id)))
     JOIN material_categories mc ON ((mc.id = m.categoria_id)))
     LEFT JOIN funcionarios f ON ((f.id = i.funcionario_id)))
     LEFT JOIN usuarios u ON ((u.id = c.registrado_por)));
CREATE OR REPLACE VIEW public.vw_movimentacoes_materiais AS  SELECT mm.id,
    mm.empresa_id,
    mm.material_id,
    m.nome AS material,
    COALESCE(mm.unidade_movimento,mm.unidade_catalogo_legado) AS unidade,
    mc.id AS categoria_id,
    mc.nome AS categoria,
    mm.obra_id,
    o.nome AS obra,
    o.parent_obra_id,
    po.nome AS obra_principal,
        CASE
            WHEN (o.parent_obra_id IS NULL) THEN o.id
            ELSE po.id
        END AS obra_principal_id,
    mm.tipo,
    mm.quantidade,
    mm.data_movimento,
    mm.obra_destino_id,
    od.nome AS obra_destino,
    mm.compra_item_id,
    mm.valor_unitario,
        CASE
            WHEN (mm.valor_unitario IS NULL) THEN NULL::numeric
            ELSE (mm.quantidade * mm.valor_unitario)
        END AS valor_total,
    mm.motivo,
    mm.observacao,
    mm.registrado_por,
    u.nome AS registrado_por_nome,
    mm.created_at
   FROM ((((((material_movimentacoes mm
     JOIN materiais m ON ((m.id = mm.material_id)))
     JOIN material_categories mc ON ((mc.id = m.categoria_id)))
     JOIN obras o ON ((o.id = mm.obra_id)))
     LEFT JOIN obras po ON ((po.id = o.parent_obra_id)))
     LEFT JOIN obras od ON ((od.id = mm.obra_destino_id)))
     LEFT JOIN usuarios u ON ((u.id = mm.registrado_por)));
CREATE OR REPLACE VIEW public.vw_estoque_materiais AS  WITH ledger AS (
         SELECT material_movimentacoes.empresa_id,
            material_movimentacoes.material_id,
            COALESCE(material_movimentacoes.unidade_movimento,material_movimentacoes.unidade_catalogo_legado) AS unidade,
            material_movimentacoes.obra_id,
            material_movimentacoes.tipo,
            material_movimentacoes.quantidade,
                CASE
                    WHEN (material_movimentacoes.tipo = ANY (ARRAY['ENTRADA'::text, 'AJUSTE_ENTRADA'::text])) THEN material_movimentacoes.quantidade
                    WHEN (material_movimentacoes.tipo = ANY (ARRAY['SAIDA'::text, 'PERDA'::text, 'AJUSTE_SAIDA'::text])) THEN (- material_movimentacoes.quantidade)
                    WHEN (material_movimentacoes.tipo = 'TRANSFERENCIA'::text) THEN (- material_movimentacoes.quantidade)
                    ELSE (0)::numeric
                END AS delta
           FROM material_movimentacoes
        UNION ALL
         SELECT material_movimentacoes.empresa_id,
            material_movimentacoes.material_id,
            COALESCE(material_movimentacoes.unidade_movimento,material_movimentacoes.unidade_catalogo_legado) AS unidade,
            material_movimentacoes.obra_destino_id,
            material_movimentacoes.tipo,
            material_movimentacoes.quantidade,
            material_movimentacoes.quantidade AS delta
           FROM material_movimentacoes
          WHERE ((material_movimentacoes.tipo = 'TRANSFERENCIA'::text) AND (material_movimentacoes.obra_destino_id IS NOT NULL))
        ), saldos AS (
         SELECT ledger.empresa_id,
            ledger.material_id, ledger.unidade,
            ledger.obra_id,
            sum(ledger.delta) AS saldo,
            sum(
                CASE
                    WHEN (ledger.delta > (0)::numeric) THEN ledger.delta
                    ELSE (0)::numeric
                END) AS entradas,
            sum(
                CASE
                    WHEN (ledger.delta < (0)::numeric) THEN (- ledger.delta)
                    ELSE (0)::numeric
                END) AS saidas
           FROM ledger
          GROUP BY ledger.empresa_id, ledger.material_id, ledger.unidade, ledger.obra_id
        )
 SELECT s.empresa_id,
    s.obra_id,
    o.nome AS obra,
    o.parent_obra_id,
    COALESCE(po.id, o.id) AS obra_principal_id,
    COALESCE(po.nome, o.nome) AS obra_principal,
    s.material_id,
    m.nome AS material,
    s.unidade,
    mc.id AS categoria_id,
    mc.nome AS categoria,
    s.entradas,
    s.saidas,
    s.saldo,
        CASE
            WHEN (s.saldo < (0)::numeric) THEN 'NEGATIVO'::text
            WHEN (s.saldo = (0)::numeric) THEN 'ZERADO'::text
            ELSE 'POSITIVO'::text
        END AS status_estoque
   FROM ((((saldos s
     JOIN obras o ON ((o.id = s.obra_id)))
     LEFT JOIN obras po ON ((po.id = o.parent_obra_id)))
     JOIN materiais m ON ((m.id = s.material_id)))
     JOIN material_categories mc ON ((mc.id = m.categoria_id)));
NOTIFY pgrst,'reload schema';
