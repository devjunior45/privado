-- Verificar se a tabela job_applications existe e tem a estrutura correta
DO $$
BEGIN
    -- Verificar se a coluna job_id existe, se não, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_applications' AND column_name = 'job_id') THEN
        ALTER TABLE job_applications ADD COLUMN job_id UUID REFERENCES job_posts(id);
    END IF;
    
    -- Verificar se a coluna user_id existe, se não, criar  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'job_applications' AND column_name = 'user_id') THEN
        ALTER TABLE job_applications ADD COLUMN user_id UUID REFERENCES profiles(id);
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_job_applications_user_job ON job_applications(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);
