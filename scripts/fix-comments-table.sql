-- Primeiro, vamos dropar a constraint existente e recriar corretamente
ALTER TABLE job_comments DROP CONSTRAINT IF EXISTS job_comments_user_id_fkey;

-- Adicionar foreign key para profiles ao invés de auth.users
ALTER TABLE job_comments 
ADD CONSTRAINT job_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Verificar se todos os user_ids em job_comments existem em profiles
-- Se houver dados órfãos, esta query irá mostrar
SELECT jc.user_id 
FROM job_comments jc 
LEFT JOIN profiles p ON jc.user_id = p.id 
WHERE p.id IS NULL;

-- Se houver dados órfãos, remover (descomente se necessário)
-- DELETE FROM job_comments 
-- WHERE user_id NOT IN (SELECT id FROM profiles);
