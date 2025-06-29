-- Verificar a estrutura da tabela job_applications
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'job_applications' 
AND table_schema = 'public'
ORDER BY ordinal_position;
