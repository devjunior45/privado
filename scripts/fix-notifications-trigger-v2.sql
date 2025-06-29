-- Remover o trigger problemático
DROP TRIGGER IF EXISTS handle_job_applications_notifications ON job_applications;
DROP FUNCTION IF EXISTS handle_job_application_notification();

-- Criar uma função que funciona com a estrutura correta da tabela notifications
CREATE OR REPLACE FUNCTION handle_job_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação para o recrutador com todos os campos obrigatórios
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    related_id,
    is_read,
    created_at
  )
  SELECT 
    jp.author_id,
    'job_application',
    'Nova candidatura recebida',
    'Você recebeu uma nova candidatura para a vaga "' || jp.title || '"',
    '/job-candidates/' || NEW.job_id,
    NEW.job_id,
    false,
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
