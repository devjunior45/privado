-- Adicionar coluna sector_ids na tabela job_posts para armazenar array de IDs dos setores
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS sector_ids INTEGER[] DEFAULT '{}';

-- Criar índice para melhorar performance nas consultas por setor
CREATE INDEX IF NOT EXISTS idx_job_posts_sector_ids ON job_posts USING GIN (sector_ids);
