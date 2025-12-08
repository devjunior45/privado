-- Criar VIEW otimizada para listar vagas do recrutador com contadores
-- Esta VIEW calcula todos os contadores diretamente no banco, evitando payload gigante

CREATE OR REPLACE VIEW recruiter_jobs_with_stats AS
SELECT 
  jp.*,
  COALESCE(COUNT(ja.id), 0) AS applications_count,
  COALESCE(SUM(CASE WHEN ja.application_type = 'platform' THEN 1 ELSE 0 END), 0) AS platform_applications_count,
  COALESCE(SUM(CASE WHEN ja.application_type = 'external' THEN 1 ELSE 0 END), 0) AS external_applications_count,
  COALESCE(SUM(CASE WHEN ja.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count,
  COALESCE(SUM(CASE WHEN ja.status = 'interview' THEN 1 ELSE 0 END), 0) AS interview_count,
  COALESCE(SUM(CASE WHEN ja.status = 'hired' THEN 1 ELSE 0 END), 0) AS hired_count,
  COALESCE(SUM(CASE WHEN ja.status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_count
FROM 
  job_posts jp
LEFT JOIN 
  job_applications ja ON jp.id = ja.job_id
GROUP BY 
  jp.id;

-- Comentário da VIEW
COMMENT ON VIEW recruiter_jobs_with_stats IS 'VIEW otimizada que retorna vagas com contadores de candidaturas calculados diretamente no banco. Evita carregar todos os relacionamentos e calcular no JavaScript.';
