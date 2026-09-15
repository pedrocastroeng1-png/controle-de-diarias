ALTER TABLE pceg_private.feriados_auditoria ENABLE ROW LEVEL SECURITY;
CREATE TABLE pceg_private.login_tentativas (
 chave text NOT NULL, janela bigint NOT NULL, tentativas integer NOT NULL,
 PRIMARY KEY(chave,janela)
);
ALTER TABLE pceg_private.login_tentativas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pceg_private.login_tentativas FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON pceg_private.login_tentativas TO service_role;
CREATE FUNCTION public.limitar_login(p_chave text) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE v_janela bigint:=floor(extract(epoch FROM now())/900);v_tentativas integer;
BEGIN
 IF p_chave IS NULL OR p_chave !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Chave inválida';END IF;
 DELETE FROM pceg_private.login_tentativas WHERE janela<v_janela-96;
 INSERT INTO pceg_private.login_tentativas(chave,janela,tentativas) VALUES(p_chave,v_janela,1)
 ON CONFLICT(chave,janela) DO UPDATE SET tentativas=login_tentativas.tentativas+1 RETURNING tentativas INTO v_tentativas;
 RETURN v_tentativas<=20;
END $$;
REVOKE ALL ON FUNCTION public.limitar_login(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.limitar_login(text) TO service_role;
NOTIFY pgrst,'reload schema';
