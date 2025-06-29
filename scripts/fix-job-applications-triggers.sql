-- Remover triggers antigos que podem estar causando problemas
DROP TRIGGER IF EXISTS handle_job_applications_notifications ON job_applications;
DROP FUNCTION IF EXISTS handle_job_application_notification();

-- Recriar a função com a estrutura correta (job_id em vez de post_id)
CREATE OR REPLACE FUNCTION handle_job_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação para o recrutador quando alguém se candidata
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    created_at
  )
  SELECT 
    jp.author_id,
    'job_application',
    'Nova candidatura',
    CONCAT(p.full_name, ' se candidatou à vaga: ', jp.title),
    NEW.job_id,
    NOW()
  FROM job_posts jp
  LEFT JOIN profiles p ON p.id = NEW.user_id
  WHERE jp.id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER handle_job_applications_notifications
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_job_application_notification();

-- Verificar se há outras funções que referenciam post_id
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_definition ILIKE '%post_id%'
        AND routine_type = 'FUNCTION'
        AND routine_schema = 'public'
    LOOP
        RAISE NOTICE 'Função encontrada que referencia post_id: %', func_record.routine_name;
    END LOOP;
END $$;
