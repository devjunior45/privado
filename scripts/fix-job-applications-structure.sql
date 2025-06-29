-- Verificar e corrigir a estrutura da tabela job_applications
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_applications') THEN
        
        -- Verificar se a coluna job_id existe, se não, verificar se é post_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'job_id') THEN
            
            -- Verificar se existe post_id
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'post_id') THEN
                -- Renomear post_id para job_id
                ALTER TABLE job_applications RENAME COLUMN post_id TO job_id;
            ELSE
                -- Adicionar coluna job_id
                ALTER TABLE job_applications ADD COLUMN job_id UUID REFERENCES job_posts(id);
            END IF;
        END IF;
        
        -- Verificar se a coluna user_id existe
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'user_id') THEN
            
            -- Verificar se existe candidate_id
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'job_applications' AND column_name = 'candidate_id') THEN
                -- Renomear candidate_id para user_id
                ALTER TABLE job_applications RENAME COLUMN candidate_id TO user_id;
            ELSE
                -- Adicionar coluna user_id
                ALTER TABLE job_applications ADD COLUMN user_id UUID REFERENCES profiles(id);
            END IF;
        END IF;
        
    ELSE
        -- Criar a tabela se não existir
        CREATE TABLE job_applications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            message TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(job_id, user_id)
        );
        
        -- Habilitar RLS
        ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
        
        -- Políticas RLS
        CREATE POLICY "Users can view their own applications" ON job_applications
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can create their own applications" ON job_applications
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Recruiters can view applications for their jobs" ON job_applications
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM job_posts 
                    WHERE job_posts.id = job_applications.job_id 
                    AND job_posts.author_id = auth.uid()
                )
            );
    END IF;
    
    -- Criar índices para melhor performance
    CREATE INDEX IF NOT EXISTS idx_job_applications_user_job ON job_applications(user_id, job_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);
    CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
    
END $$;

-- Verificar a estrutura final
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
ORDER BY ordinal_position;
