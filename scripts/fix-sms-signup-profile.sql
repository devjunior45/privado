-- Corrigir trigger para gerar username automaticamente quando usuário criar conta via SMS
-- O problema é que quando não há email (signup via SMS), o username fica null

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Função para gerar username aleatório único
CREATE OR REPLACE FUNCTION public.generate_unique_username()
RETURNS TEXT AS $$
DECLARE
  new_username TEXT;
  username_exists BOOLEAN;
BEGIN
  LOOP
    -- Gera username aleatório: user_ + 8 caracteres alfanuméricos
    new_username := 'user_' || substr(md5(random()::text), 1, 8);
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = new_username) INTO username_exists;
    
    -- Se não existe, retorna
    IF NOT username_exists THEN
      RETURN new_username;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função melhorada para criar perfil com username automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Gera username baseado em email ou aleatório
  IF NEW.email IS NOT NULL THEN
    generated_username := COALESCE(
      NEW.raw_user_meta_data->>'username', 
      split_part(NEW.email, '@', 1)
    );
  ELSE
    -- Se não tem email (signup via SMS), gera username aleatório
    generated_username := generate_unique_username();
  END IF;

  -- Garante que username nunca seja null
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    user_type,
    whatsapp,
    city_id,
    company_name,
    company_location,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    generated_username, -- Username sempre preenchido
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate'),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NEW.phone),
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
    email = COALESCE(EXCLUDED.email, profiles.email),
    username = COALESCE(profiles.username, EXCLUDED.username),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    user_type = COALESCE(profiles.user_type, EXCLUDED.user_type),
    whatsapp = COALESCE(profiles.whatsapp, EXCLUDED.whatsapp),
    city_id = COALESCE(profiles.city_id, EXCLUDED.city_id),
    company_name = COALESCE(profiles.company_name, EXCLUDED.company_name),
    company_location = COALESCE(profiles.company_location, EXCLUDED.company_location);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Trigger atualizado com sucesso! Agora usernames são gerados automaticamente para signup via SMS.';
END $$;
