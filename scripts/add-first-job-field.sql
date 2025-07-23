-- Adicionar campo para indicar se é primeiro emprego
ALTER TABLE profiles 
ADD COLUMN is_first_job BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN profiles.is_first_job IS 'Indica se o usuário está procurando seu primeiro emprego';
