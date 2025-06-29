-- Script para migrar dados existentes para usar city_id

-- Atualizar job_posts com city_id baseado no campo location
UPDATE job_posts 
SET city_id = (
  SELECT c.id 
  FROM cities c 
  WHERE job_posts.location ILIKE '%' || c.name || '%' 
    AND job_posts.location ILIKE '%' || c.state || '%'
  LIMIT 1
)
WHERE city_id IS NULL AND location IS NOT NULL;

-- Atualizar profiles com city_id baseado nos campos city e state
UPDATE profiles 
SET city_id = (
  SELECT c.id 
  FROM cities c 
  WHERE profiles.city = c.name 
    AND profiles.state = c.state
  LIMIT 1
)
WHERE city_id IS NULL AND city IS NOT NULL AND state IS NOT NULL;

-- Verificar quantos registros foram atualizados
SELECT 
  'job_posts' as table_name,
  COUNT(*) as total_records,
  COUNT(city_id) as records_with_city_id,
  COUNT(*) - COUNT(city_id) as records_without_city_id
FROM job_posts
UNION ALL
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_records,
  COUNT(city_id) as records_with_city_id,
  COUNT(*) - COUNT(city_id) as records_without_city_id
FROM profiles;
