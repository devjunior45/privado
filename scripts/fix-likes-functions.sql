-- Verificar se a coluna likes_count existe na tabela job_posts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_posts' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE job_posts ADD COLUMN likes_count INTEGER DEFAULT 0;
        
        -- Atualizar contadores existentes baseado nos likes atuais
        UPDATE job_posts 
        SET likes_count = (
            SELECT COUNT(*) 
            FROM post_likes 
            WHERE post_likes.post_id = job_posts.id
        );
    END IF;
END $$;

-- Criar ou substituir função para incrementar likes
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE job_posts 
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = post_id;
END;
$$;

-- Criar ou substituir função para decrementar likes
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE job_posts 
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = post_id;
END;
$$;

-- Garantir que as funções tenham as permissões corretas
GRANT EXECUTE ON FUNCTION increment_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes(UUID) TO authenticated;

-- Verificar e corrigir contadores existentes
UPDATE job_posts 
SET likes_count = (
    SELECT COUNT(*) 
    FROM post_likes 
    WHERE post_likes.post_id = job_posts.id
)
WHERE likes_count IS NULL OR likes_count != (
    SELECT COUNT(*) 
    FROM post_likes 
    WHERE post_likes.post_id = job_posts.id
);
