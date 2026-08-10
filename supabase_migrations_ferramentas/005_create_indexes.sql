CREATE INDEX IF NOT EXISTS idx_ferramentas_status ON public.ferramentas(status);
CREATE INDEX IF NOT EXISTS idx_ferramentas_codigo ON public.ferramentas(codigo_interno);

CREATE INDEX IF NOT EXISTS idx_emprestimos_ferramenta_id ON public.emprestimos_ferramentas(ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_funcionario_id ON public.emprestimos_ferramentas(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_obra_id ON public.emprestimos_ferramentas(obra_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_data_devolucao ON public.emprestimos_ferramentas(data_devolucao) WHERE data_devolucao IS NULL;

-- Índice único parcial para impedir empréstimos simultâneos da mesma ferramenta
CREATE UNIQUE INDEX IF NOT EXISTS idx_ferramenta_emprestimo_ativo ON public.emprestimos_ferramentas(ferramenta_id) WHERE data_devolucao IS NULL;

CREATE INDEX IF NOT EXISTS idx_historico_ferramenta_id ON public.historico_ferramentas(ferramenta_id);
