-- Run only after the compatible frontend is in production.
-- No attendance rows or financial definitions are changed.
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public.presencas IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE attendance_removal_baseline ON COMMIT DROP AS select jsonb_build_object(
'periodo','2026-09-01 a 2026-09-18',
'presencas',(select jsonb_build_object('registros',count(*),'presentes',count(*) filter(where presente),'integrais',count(*) filter(where presente and tipo_diaria='DIARIA'),'meias',count(*) filter(where presente and tipo_diaria='MEIA_DIARIA'),'hash',md5(coalesce(string_agg((to_jsonb(p)-'photo_path'-'photo_taken_at'-'photo_taken_by')::text,'' order by id),''))) from public.presencas p),
'relatorio',(select jsonb_build_object('linhas',count(*),'presentes',count(*) filter(where status='PRESENTE'),'meias',count(*) filter(where status='PRESENTE' and tipo_diaria='MEIA_DIARIA'),'valor',sum(valor_calculado),'hash',md5(coalesce(string_agg(to_jsonb(r)::text,'' order by funcionario_id,data,id),''))) from public.vw_relatorio_presencas r where data between '2026-09-01' and '2026-09-18'),
'folha',(select jsonb_build_object('linhas',count(*),'valor',sum(valor_calculado),'hash',md5(coalesce(string_agg(to_jsonb(r)::text,'' order by funcionario_id,data,id),''))) from public.vw_folha_diarias r where data between '2026-09-01' and '2026-09-18'),
'clt',(select jsonb_build_object('linhas',count(*),'hash',md5(coalesce(string_agg((to_jsonb(r)-'photo_path'-'photo_taken_at')::text,'' order by id),''))) from public.vw_relatorio_funcionarios_clt r),
'employee_photos',(select jsonb_build_object('count',count(photo_path),'hash',md5(string_agg(id::text||coalesce(photo_path,''),'' order by id))) from funcionarios),
'certificates',(select jsonb_build_object('count',count(*),'hash',md5(string_agg(to_jsonb(r)::text,'' order by id))) from medical_certificates r)
) as baseline;
DROP VIEW public.vw_relatorio_funcionarios_clt RESTRICT;
CREATE VIEW public.vw_relatorio_funcionarios_clt AS  SELECT p.id,
    p.data,
        CASE
            WHEN p.presente THEN 'PRESENTE'::text
            ELSE 'FALTOU'::text
        END AS status,
    f.id AS funcionario_id,
    f.nome AS funcionario,
    fn.nome AS funcao,
    f.tipo_colaborador,
    true AS eh_clt,
    o.id AS obra_id,
    o.nome AS obra,
    COALESCE(po.nome, o.nome) AS obra_principal,
        CASE
            WHEN o.parent_obra_id IS NULL THEN NULL::uuid
            ELSE o.id
        END AS subobra_id,
        CASE
            WHEN o.parent_obra_id IS NULL THEN NULL::text
            ELSE o.nome
        END AS subobra,
    f.empresa_id,
    f.data_admissao,
    f.data_desligamento,
    f.ativo AS funcionario_ativo,
    o.ativo AS obra_ativa
   FROM presencas p
     JOIN funcionarios f ON f.id = p.funcionario_id
     JOIN funcoes fn ON fn.id = f.funcao_id
     JOIN obras o ON o.id = p.obra_id
     LEFT JOIN obras po ON po.id = o.parent_obra_id
  WHERE f.tipo_colaborador = 'CLT'::text AND EXTRACT(isodow FROM p.data) >= 1::numeric AND EXTRACT(isodow FROM p.data) <= 5::numeric;
ALTER VIEW public.vw_relatorio_funcionarios_clt OWNER TO postgres;
GRANT ALL ON public.vw_relatorio_funcionarios_clt TO anon, authenticated, service_role;
ALTER TABLE public.presencas
  DROP COLUMN photo_path RESTRICT,
  DROP COLUMN photo_taken_at RESTRICT,
  DROP COLUMN photo_taken_by RESTRICT;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-attendance-photos-daily';
DROP POLICY IF EXISTS "Allow anon all attendance photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated all attendance photos" ON storage.objects;
CREATE TEMP TABLE attendance_removal_after ON COMMIT DROP AS select jsonb_build_object(
'periodo','2026-09-01 a 2026-09-18',
'presencas',(select jsonb_build_object('registros',count(*),'presentes',count(*) filter(where presente),'integrais',count(*) filter(where presente and tipo_diaria='DIARIA'),'meias',count(*) filter(where presente and tipo_diaria='MEIA_DIARIA'),'hash',md5(coalesce(string_agg((to_jsonb(p)-'photo_path'-'photo_taken_at'-'photo_taken_by')::text,'' order by id),''))) from public.presencas p),
'relatorio',(select jsonb_build_object('linhas',count(*),'presentes',count(*) filter(where status='PRESENTE'),'meias',count(*) filter(where status='PRESENTE' and tipo_diaria='MEIA_DIARIA'),'valor',sum(valor_calculado),'hash',md5(coalesce(string_agg(to_jsonb(r)::text,'' order by funcionario_id,data,id),''))) from public.vw_relatorio_presencas r where data between '2026-09-01' and '2026-09-18'),
'folha',(select jsonb_build_object('linhas',count(*),'valor',sum(valor_calculado),'hash',md5(coalesce(string_agg(to_jsonb(r)::text,'' order by funcionario_id,data,id),''))) from public.vw_folha_diarias r where data between '2026-09-01' and '2026-09-18'),
'clt',(select jsonb_build_object('linhas',count(*),'hash',md5(coalesce(string_agg((to_jsonb(r)-'photo_path'-'photo_taken_at')::text,'' order by id),''))) from public.vw_relatorio_funcionarios_clt r),
'employee_photos',(select jsonb_build_object('count',count(photo_path),'hash',md5(string_agg(id::text||coalesce(photo_path,''),'' order by id))) from funcionarios),
'certificates',(select jsonb_build_object('count',count(*),'hash',md5(string_agg(to_jsonb(r)::text,'' order by id))) from medical_certificates r)
) as baseline;
DO $$
BEGIN
 IF (SELECT baseline FROM attendance_removal_baseline) IS DISTINCT FROM (SELECT baseline FROM attendance_removal_after) THEN
   RAISE EXCEPTION 'Attendance removal changed non-photo data or financial totals';
 END IF;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;
