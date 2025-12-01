-- Tornar username nullable temporariamente para permitir criação via telefone
ALTER TABLE public.profiles 
ALTER COLUMN username DROP NOT NULL;

-- Atualizar trigger para gerar username genérico quando não houver email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Gerar username: usar email se disponível, senão usar ID do usuário
  IF NEW.email IS NOT NULL THEN
    generated_username := split_part(NEW.email, '@', 1);
  ELSIF NEW.phone IS NOT NULL THEN
    generated_username := 'user' || substring(NEW.phone from '.{4}$') || floor(random() * 100)::text;
  ELSE
    generated_username := 'user' || substring(NEW.id::text from 1 for 8);
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    user_type,
    city_id,
    company_name,
    company_location,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', generated_username),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'city_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'city_id')::INTEGER 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_location',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    user_type = COALESCE(profiles.user_type, EXCLUDED.user_type),
    city_id = COALESCE(profiles.city_id, EXCLUDED.city_id),
    company_name = COALESCE(profiles.company_name, EXCLUDED.company_name),
    company_location = COALESCE(profiles.company_location, EXCLUDED.company_location);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
