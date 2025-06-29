-- Atualizar tabela profiles para incluir novos campos
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS cnh_types TEXT[] DEFAULT '{}';

-- Alterar campo education para ser JSONB (array de objetos)
-- Primeiro, vamos criar uma nova coluna temporária
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education_new JSONB DEFAULT '[]';

-- Migrar dados existentes (se houver)
UPDATE profiles 
SET education_new = CASE 
  WHEN education IS NOT NULL AND education != '' 
  THEN jsonb_build_array(jsonb_build_object(
    'level', 'Outros',
    'institution', education,
    'isComplete', true
  ))
  ELSE '[]'::jsonb
END
WHERE education_new = '[]'::jsonb;

-- Remover coluna antiga e renomear a nova
ALTER TABLE profiles DROP COLUMN IF EXISTS education;
ALTER TABLE profiles RENAME COLUMN education_new TO education;

-- Atualizar campo experiences para incluir novos campos
-- Como já é JSONB, vamos apenas garantir que existe
UPDATE profiles 
SET experiences = COALESCE(experiences, '[]'::jsonb)
WHERE experiences IS NULL;
