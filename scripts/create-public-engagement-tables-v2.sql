-- Primeiro, vamos verificar e ajustar a estrutura da tabela job_posts
-- Adicionar colunas necessárias se não existirem
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Criar tabela para rastrear visualizações de vagas
CREATE TABLE IF NOT EXISTS job_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Criar tabela para rastrear curtidas (se não existir)
CREATE TABLE IF NOT EXISTS job_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES job_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_job_likes_job_id ON job_likes(job_id);
CREATE INDEX IF NOT EXISTS idx_job_likes_user_id ON job_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_job_likes_liked_at ON job_likes(liked_at);

-- Função para registrar visualização
CREATE OR REPLACE FUNCTION register_job_view(p_job_id UUID, p_user_id UUID DEFAULT NULL, p_ip_address INET DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
  -- Inserir visualização
  INSERT INTO job_views (job_id, user_id, ip_address, user_agent)
  VALUES (p_job_id, p_user_id, p_ip_address, p_user_agent);
  
  -- Incrementar contador
  UPDATE job_posts 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- Função para curtir/descurtir
CREATE OR REPLACE FUNCTION toggle_job_like(p_job_id UUID, p_user_id UUID)
RETURNS boolean AS $$
DECLARE
  like_exists boolean;
BEGIN
  -- Verificar se já existe curtida
  SELECT EXISTS(
    SELECT 1 FROM job_likes 
    WHERE job_id = p_job_id AND user_id = p_user_id
  ) INTO like_exists;
  
  IF like_exists THEN
    -- Remover curtida
    DELETE FROM job_likes 
    WHERE job_id = p_job_id AND user_id = p_user_id;
    
    -- Decrementar contador
    UPDATE job_posts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) 
    WHERE id = p_job_id;
    
    RETURN false; -- Descurtiu
  ELSE
    -- Adicionar curtida
    INSERT INTO job_likes (job_id, user_id)
    VALUES (p_job_id, p_user_id);
    
    -- Incrementar contador
    UPDATE job_posts 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = p_job_id;
    
    RETURN true; -- Curtiu
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar contadores existentes
CREATE OR REPLACE FUNCTION sync_engagement_counters()
RETURNS void AS $$
BEGIN
  -- Sincronizar contador de curtidas
  UPDATE job_posts 
  SET likes_count = (
    SELECT COUNT(*) 
    FROM job_likes 
    WHERE job_likes.job_id = job_posts.id
  );
  
  -- Sincronizar contador de visualizações
  UPDATE job_posts 
  SET views_count = (
    SELECT COUNT(*) 
    FROM job_views 
    WHERE job_views.job_id = job_posts.id
  );
END;
$$ LANGUAGE plpgsql;

-- RLS para job_views
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- Política para inserir visualizações (qualquer usuário)
CREATE POLICY "Anyone can insert job views" ON job_views
  FOR INSERT WITH CHECK (true);

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

-- RLS para job_likes
ALTER TABLE job_likes ENABLE ROW LEVEL SECURITY;

-- Política para curtidas - qualquer usuário autenticado pode curtir
CREATE POLICY "Authenticated users can manage likes" ON job_likes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para visualizar curtidas - todos podem ver
CREATE POLICY "Anyone can view likes" ON job_likes
  FOR SELECT USING (true);

-- Executar sincronização inicial dos contadores
SELECT sync_engagement_counters();
