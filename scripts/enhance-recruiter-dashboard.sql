-- Adicionar campos para gestão de vagas
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campos para gestão de candidatos
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'rejected', 'hired')),
ADD COLUMN IF NOT EXISTS recruiter_notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar tabela para rastrear visualizações de vagas
CREATE TABLE IF NOT EXISTS job_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id, DATE(viewed_at)) -- Evita múltiplas visualizações do mesmo usuário no mesmo dia
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_job_posts_status ON job_posts(status);
CREATE INDEX IF NOT EXISTS idx_job_posts_author_status ON job_posts(author_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_post_status ON job_applications(post_id, status);
CREATE INDEX IF NOT EXISTS idx_job_views_job_date ON job_views(job_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at);

-- Função para atualizar contador de visualizações
CREATE OR REPLACE FUNCTION update_job_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_posts 
  SET views_count = (
    SELECT COUNT(DISTINCT user_id) 
    FROM job_views 
    WHERE job_id = NEW.job_id
  )
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS job_views_count_trigger ON job_views;
CREATE TRIGGER job_views_count_trigger
AFTER INSERT ON job_views
FOR EACH ROW
EXECUTE FUNCTION update_job_views_count();

-- Função para atualizar updated_at em job_applications
CREATE OR REPLACE FUNCTION update_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS application_updated_at_trigger ON job_applications;
CREATE TRIGGER application_updated_at_trigger
BEFORE UPDATE ON job_applications
FOR EACH ROW
EXECUTE FUNCTION update_application_updated_at();

-- Inserir dados de exemplo para visualizações (opcional)
-- Isso pode ser removido em produção
INSERT INTO job_views (job_id, user_id, viewed_at)
SELECT 
  jp.id,
  p.id,
  NOW() - (random() * interval '30 days')
FROM job_posts jp
CROSS JOIN profiles p
WHERE random() < 0.3 -- 30% chance de visualização
ON CONFLICT DO NOTHING;

-- Atualizar contadores existentes
UPDATE job_posts 
SET views_count = (
  SELECT COUNT(DISTINCT user_id) 
  FROM job_views 
  WHERE job_id = job_posts.id
);
