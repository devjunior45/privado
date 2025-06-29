-- Remover TODOS os triggers e funções relacionados a job_applications
DROP TRIGGER IF EXISTS handle_job_applications_notifications ON job_applications;
DROP TRIGGER IF EXISTS job_applications_trigger ON job_applications;
DROP TRIGGER IF EXISTS notify_job_application ON job_applications;
DROP TRIGGER IF EXISTS handle_new_job_application ON job_applications;

-- Remover todas as funções relacionadas
DROP FUNCTION IF EXISTS handle_job_application_notification();
DROP FUNCTION IF EXISTS notify_job_application();
DROP FUNCTION IF EXISTS handle_new_job_application();
DROP FUNCTION IF EXISTS job_applications_trigger_function();

-- Verificar se ainda existem triggers na tabela job_applications
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'job_applications';

-- Criar uma função simples e segura para notificações
CREATE OR REPLACE FUNCTION notify_recruiter_of_application()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir notificação apenas se conseguir encontrar o autor da vaga
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
    'Nova candidatura',
    'Você recebeu uma nova candidatura para sua vaga.',
    '/job-candidates/' || NEW.job_id,
    NEW.job_id,
    false,
    NOW()
  FROM job_posts jp
  WHERE jp.id = NEW.job_id
  AND jp.author_id IS NOT NULL;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Se der erro, apenas retorna NEW sem falhar a inserção
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger simples
CREATE TRIGGER notify_recruiter_on_application
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_recruiter_of_application();
