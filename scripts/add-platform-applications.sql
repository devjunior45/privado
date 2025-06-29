-- Adicionar campo para permitir candidaturas na plataforma
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS allow_platform_applications BOOLEAN DEFAULT false;

-- Adicionar campos para armazenar currículo na candidatura
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS resume_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS application_type VARCHAR(20) DEFAULT 'external' CHECK (application_type IN ('external', 'platform'));

-- Criar índice para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_job_posts_platform_applications ON job_posts(allow_platform_applications);
CREATE INDEX IF NOT EXISTS idx_job_applications_type ON job_applications(application_type);

-- Função para notificar recrutador sobre nova candidatura
CREATE OR REPLACE FUNCTION notify_recruiter_new_application()
RETURNS TRIGGER AS $$
DECLARE
  recruiter_id UUID;
  job_title TEXT;
  candidate_name TEXT;
BEGIN
  -- Buscar informações da vaga e recrutador
  SELECT author_id, title INTO recruiter_id, job_title 
  FROM job_posts 
  WHERE id = NEW.post_id;
  
  -- Buscar nome do candidato
  SELECT COALESCE(full_name, username) INTO candidate_name 
  FROM profiles 
  WHERE id = NEW.user_id;
  
  -- Inserir notificação para o recrutador
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    link,
    related_id
  ) VALUES (
    recruiter_id,
    'new_application',
    'Nova candidatura recebida',
    candidate_name || ' se candidatou para a vaga "' || job_title || '"',
    '/dashboard?tab=applications&job=' || NEW.post_id,
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar sobre novas candidaturas
DROP TRIGGER IF EXISTS new_application_notification_trigger ON job_applications;
CREATE TRIGGER new_application_notification_trigger
AFTER INSERT ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_recruiter_new_application();

-- Atualizar tipo de notificação existente
UPDATE notifications 
SET type = 'new_application' 
WHERE type = 'application_update';
