-- Adicionar colunas de visibilidade na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_visible BOOLEAN DEFAULT true;

-- Comentários para documentação
COMMENT ON COLUMN profiles.phone_visible IS 'Define se o número de telefone é visível publicamente';
COMMENT ON COLUMN profiles.email_visible IS 'Define se o e-mail é visível publicamente';
