-- Adiciona uma coluna do tipo JSONB para armazenar um array de IDs de setores
ALTER TABLE job_posts
ADD COLUMN IF NOT EXISTS sector_ids JSONB;

-- (Opcional) Cria um índice para otimizar as buscas na coluna de setores
CREATE INDEX IF NOT EXISTS idx_job_posts_sector_ids ON job_posts USING GIN (sector_ids);
