CREATE TABLE public.feriados (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
 data date NOT NULL,
 descricao text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT feriados_empresa_data_unique UNIQUE (empresa_id, data),
 CONSTRAINT feriados_descricao_valida CHECK (char_length(btrim(descricao)) BETWEEN 1 AND 500),
 CONSTRAINT feriados_data_finita CHECK (isfinite(data))
);
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.feriados FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feriados TO service_role;
COMMENT ON TABLE public.feriados IS 'Feriados não remunerados por empresa, aplicáveis a todas as obras. Acesso via servidor com validação de administrador. Integração de cálculos e bloqueio de presenças ainda pendentes; a tabela isoladamente não altera diárias.';
COMMENT ON COLUMN public.feriados.data IS 'Data civil do feriado, sem conversão de fuso horário.';
COMMENT ON COLUMN public.feriados.created_at IS 'Momento do cadastro; não é a data do feriado.';
NOTIFY pgrst, 'reload schema';
