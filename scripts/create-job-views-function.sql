-- Adicionar coluna views_count se não existir
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Criar tabela job_views se não existir
CREATE TABLE IF NOT EXISTS job_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id, created_at::date)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_created_at ON job_views(created_at);

-- Criar função increment_job_views
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE job_posts 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS na tabela job_views
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- Política para inserir visualizações
CREATE POLICY IF NOT EXISTS "Anyone can insert job views" 
ON job_views FOR INSERT 
WITH CHECK (true);

-- Política para visualizar próprias views
CREATE POLICY IF NOT EXISTS "Users can view own job views" 
ON job_views FOR SELECT 
USING (auth.uid() = user_id);

-- Política para recrutadores verem views de suas vagas
CREATE POLICY IF NOT EXISTS "Recruiters can view job views" 
ON job_views FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM job_posts 
    WHERE job_posts.id = job_views.job_id 
    AND job_posts.author_id = auth.uid()
  )
);
