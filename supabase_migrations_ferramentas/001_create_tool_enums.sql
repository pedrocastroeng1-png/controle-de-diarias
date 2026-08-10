DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tool_status') THEN
        CREATE TYPE public.tool_status AS ENUM ('ATIVA', 'EMPRESTADA', 'EM_REPARO', 'PERDIDA', 'INATIVA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_condition') THEN
        CREATE TYPE public.return_condition AS ENUM ('PERFEITO_ESTADO', 'DANIFICADA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tool_event_type') THEN
        CREATE TYPE public.tool_event_type AS ENUM ('CADASTRO', 'EDICAO', 'EMPRESTIMO', 'DEVOLUCAO', 'REPARO', 'PERDA', 'INATIVACAO', 'REATIVACAO');
    END IF;
END $$;
