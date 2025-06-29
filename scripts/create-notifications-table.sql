-- Criar tabela para notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'comment_reply', 'job_match', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  related_id UUID, -- ID relacionado (post_id, comment_id, etc.)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Função para criar notificação de resposta a comentário
CREATE OR REPLACE FUNCTION create_comment_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_comment RECORD;
  post_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Só criar notificação se for uma resposta (tem parent_id)
  IF NEW.parent_id IS NOT NULL THEN
    -- Buscar informações do comentário pai
    SELECT * INTO parent_comment FROM job_comments WHERE id = NEW.parent_id;
    
    -- Só notificar se o autor do comentário pai for diferente do autor da resposta
    IF parent_comment.user_id != NEW.user_id THEN
      -- Buscar título da vaga
      SELECT title INTO post_title FROM job_posts WHERE id = NEW.post_id;
      
      -- Buscar nome do comentarista
      SELECT COALESCE(full_name, username) INTO commenter_name FROM profiles WHERE id = NEW.user_id;
      
      -- Inserir notificação
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        link,
        related_id
      ) VALUES (
        parent_comment.user_id,
        'comment_reply',
        'Nova resposta ao seu comentário',
        commenter_name || ' respondeu ao seu comentário na vaga "' || post_title || '"',
        '/feed?post=' || NEW.post_id || '&comments=true',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar notificação quando um comentário é respondido
CREATE TRIGGER comment_reply_notification_trigger
AFTER INSERT ON job_comments
FOR EACH ROW
EXECUTE FUNCTION create_comment_reply_notification();

-- Função para criar notificação de vaga compatível
CREATE OR REPLACE FUNCTION create_job_match_notification()
RETURNS TRIGGER AS $$
DECLARE
  matching_user RECORD;
  user_skills TEXT[];
  job_skills TEXT[];
  common_skills TEXT[];
  skill_match_count INTEGER;
BEGIN
  -- Extrair palavras-chave da descrição da vaga
  job_skills := regexp_split_to_array(lower(NEW.description), '\s+');
  
  -- Buscar usuários candidatos com habilidades
  FOR matching_user IN 
    SELECT id, username, full_name, skills 
    FROM profiles 
    WHERE user_type = 'candidate' AND skills IS NOT NULL AND array_length(skills, 1) > 0
  LOOP
    -- Verificar correspondência de habilidades
    user_skills := matching_user.skills;
    common_skills := ARRAY(
      SELECT DISTINCT unnest(user_skills)
      INTERSECT
      SELECT DISTINCT unnest(job_skills)
    );
    
    skill_match_count := array_length(common_skills, 1);
    
    -- Se houver pelo menos 2 habilidades em comum, criar notificação
    IF skill_match_count >= 2 THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        link,
        related_id
      ) VALUES (
        matching_user.id,
        'job_match',
        'Vaga compatível com seu perfil',
        'Encontramos uma vaga de "' || NEW.title || '" que corresponde às suas habilidades',
        '/feed?post=' || NEW.id,
        NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar notificação quando uma nova vaga é publicada
CREATE TRIGGER job_match_notification_trigger
AFTER INSERT ON job_posts
FOR EACH ROW
EXECUTE FUNCTION create_job_match_notification();
