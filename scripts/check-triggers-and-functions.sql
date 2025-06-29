-- Verificar triggers na tabela job_applications
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'job_applications';

-- Verificar funções que podem referenciar post_id
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%post_id%'
AND routine_type = 'FUNCTION';
