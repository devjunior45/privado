-- Criar tabela para rastrear visualizações de vagas
CREATE TABLE IF NOT EXISTS job_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_created_at ON job_views(created_at);

-- Adicionar contador de visualizações na tabela job_posts se não existir
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Função para incrementar visualizações
CREATE OR REPLACE FUNCTION increment_job_views(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE job_posts 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar curtidas
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE job_posts 
  SET likes_count = COALESCE(likes_count, 0) + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Função para decrementar curtidas
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE job_posts 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- RLS para job_views - permitir que recrutadores vejam views das suas vagas
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- Política para inserir visualizações (qualquer usuário autenticado)
CREATE POLICY "Users can insert job views" ON job_views
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Política para visualizar views (recrutadores podem ver views das suas vagas)
CREATE POLICY "Recruiters can view job views" ON job_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM job_posts 
      WHERE job_posts.id = job_views.job_id 
      AND job_posts.author_id = auth.uid()
    )
  );

-- Política para visualizar próprias views
CREATE POLICY "Users can view own job views" ON job_views
  FOR SELECT USING (auth.uid() = user_id);
