-- Adicionar coluna city_id na tabela job_posts
ALTER TABLE job_posts 
ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id);

-- Adicionar coluna city_id na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_job_posts_city_id ON job_posts(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);

-- Atualizar trigger para incluir city_id no perfil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    user_type, 
    company_name, 
    company_location,
    city_id
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate'),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_location',
    CASE 
      WHEN NEW.raw_user_meta_data->>'city_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'city_id')::INTEGER
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
