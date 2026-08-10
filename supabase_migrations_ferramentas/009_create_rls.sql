ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimos_ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_ferramentas ENABLE ROW LEVEL SECURITY;

-- Limpar policies anteriores para garantir idempotência limpa
DROP POLICY IF EXISTS "Admin e Operador leem ferramentas" ON public.ferramentas;
DROP POLICY IF EXISTS "Admin gerencia ferramentas" ON public.ferramentas;
DROP POLICY IF EXISTS "Todos leem emprestimos" ON public.emprestimos_ferramentas;
DROP POLICY IF EXISTS "Admin gerencia emprestimos" ON public.emprestimos_ferramentas;
DROP POLICY IF EXISTS "Operador cria emprestimos" ON public.emprestimos_ferramentas;
DROP POLICY IF EXISTS "Operador atualiza emprestimos" ON public.emprestimos_ferramentas;
DROP POLICY IF EXISTS "Todos leem historico" ON public.historico_ferramentas;
DROP POLICY IF EXISTS "Admin gerencia historico" ON public.historico_ferramentas;
DROP POLICY IF EXISTS "Operador cria historico" ON public.historico_ferramentas;
DROP POLICY IF EXISTS "Operador insere historico" ON public.historico_ferramentas;

-- FERRAMENTAS
CREATE POLICY "Admin e Operador leem ferramentas" ON public.ferramentas FOR SELECT USING (true);
CREATE POLICY "Admin gerencia ferramentas" ON public.ferramentas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);

-- EMPRESTIMOS
CREATE POLICY "Todos leem emprestimos" ON public.emprestimos_ferramentas FOR SELECT USING (true);
CREATE POLICY "Admin gerencia emprestimos" ON public.emprestimos_ferramentas FOR ALL USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND perfil = 'ADMIN')
);
-- Inserções e atualizações por operadores devem ocorrer apenas via RPCs (Security Definer).

-- HISTORICO
CREATE POLICY "Todos leem historico" ON public.historico_ferramentas FOR SELECT USING (true);
-- Não há policy de INSERT para usuários, as triggers/RPCs farão inserção bypassando RLS devido ao Security Definer.
