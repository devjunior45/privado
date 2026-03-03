-- Add whatsapp_contact column to job_posts
ALTER TABLE job_posts
ADD COLUMN IF NOT EXISTS whatsapp_contact TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN job_posts.whatsapp_contact IS 'Numero de WhatsApp para contato direto com o recrutador';
