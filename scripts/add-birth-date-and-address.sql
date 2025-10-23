-- Adicionar campos birth_date e address à tabela profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN profiles.birth_date IS 'Data de nascimento do candidato';
COMMENT ON COLUMN profiles.address IS 'Endereço do candidato';
