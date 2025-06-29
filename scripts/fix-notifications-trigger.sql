-- Remover o trigger problemático
DROP TRIGGER IF EXISTS handle_job_applications_notifications ON job_applications;
DROP FUNCTION IF EXISTS handle_job_application_notification();

-- Criar uma função mais simples que funciona com a estrutura existente
CREATE OR REPLACE FUNCTION handle_job_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação básica para o recrutador
  INSERT INTO notifications (
    user_id,
    type,
    title,
    related_id,
    created_at
  )
  SELECT 
    jp.author_id,
    'job_application',
    'Nova candidatura recebida',
    NEW.job_id,
    NOW()
  FROM job_posts jp
  WHERE jp.id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER handle_job_applications_notifications
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_job_application_notification();
