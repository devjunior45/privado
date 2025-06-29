-- Script para remover TODOS os triggers e funções que podem estar causando problemas

-- 1. Listar todos os triggers na tabela job_applications
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'job_applications'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON job_applications';
        RAISE NOTICE 'Removido trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- 2. Remover todas as funções que podem estar relacionadas
DROP FUNCTION IF EXISTS handle_job_application_notification() CASCADE;
DROP FUNCTION IF EXISTS notify_job_application() CASCADE;
DROP FUNCTION IF EXISTS handle_new_job_application() CASCADE;
DROP FUNCTION IF EXISTS job_applications_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS notify_recruiter_of_application() CASCADE;
DROP FUNCTION IF EXISTS handle_job_applications_notifications() CASCADE;
DROP FUNCTION IF EXISTS job_application_notification() CASCADE;
DROP FUNCTION IF EXISTS new_job_application_notification() CASCADE;

-- 3. Verificar se ainda existem triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'job_applications';

-- 4. Criar uma função simples SEM referências a post_id
CREATE OR REPLACE FUNCTION simple_job_application_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Tentar inserir notificação de forma segura
  BEGIN
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
      'Você recebeu uma nova candidatura.',
      '/job-candidates/' || NEW.job_id,
      NEW.job_id,
      false,
      NOW()
    FROM job_posts jp
    WHERE jp.id = NEW.job_id;
  EXCEPTION
    WHEN OTHERS THEN
      -- Se der qualquer erro, apenas ignora
      NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar o trigger simples
CREATE TRIGGER simple_application_notification
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION simple_job_application_notification();

-- 6. Verificar o resultado final
SELECT 
    trigger_name, 
    event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'job_applications';
