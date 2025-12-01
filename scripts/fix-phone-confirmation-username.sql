-- Corrige o trigger para gerar username automático durante confirmação por telefone
-- Isso resolve o erro de "null value in column username violates not-null constraint"

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Função para remover acentos e gerar username base
CREATE OR REPLACE FUNCTION public.generate_username_from_email(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  username_base TEXT;
  random_suffix TEXT;
  final_username TEXT;
  username_exists BOOLEAN;
  attempt INT := 0;
BEGIN
  -- Extrai parte antes do @ e remove caracteres especiais
  username_base := regexp_replace(split_part(user_email, '@', 1), '[^a-zA-Z0-9]', '', 'g');
  username_base := lower(username_base);
  
  -- Limita a 15 caracteres
  IF length(username_base) > 15 THEN
    username_base := substring(username_base, 1, 15);
  END IF;
  
  -- Tenta gerar username único
  LOOP
    random_suffix := lpad(floor(random() * 1000)::text, 3, '0');
    final_username := username_base || random_suffix;
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) INTO username_exists;
    
    IF NOT username_exists THEN
      RETURN final_username;
    END IF;
    
    attempt := attempt + 1;
    IF attempt > 10 THEN
      -- Fallback: usa timestamp
      final_username := username_base || substring(extract(epoch from now())::text, -3);
      RETURN final_username;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Cria a função melhorada para criar perfil com username automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Gera username automaticamente se não fornecido
  IF NEW.raw_user_meta_data->>'username' IS NULL OR NEW.raw_user_meta_data->>'username' = '' THEN
    generated_username := public.generate_username_from_email(NEW.email);
  ELSE
    generated_username := NEW.raw_user_meta_data->>'username';
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
    whatsapp,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    generated_username, -- Sempre usa um username válido
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'city_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'city_id')::INTEGER 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'company_location',
    NEW.raw_user_meta_data->>'whatsapp',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username),
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    user_type = COALESCE(profiles.user_type, EXCLUDED.user_type),
    city_id = COALESCE(profiles.city_id, EXCLUDED.city_id),
    company_name = COALESCE(profiles.company_name, EXCLUDED.company_name),
    company_location = COALESCE(profiles.company_location, EXCLUDED.company_location),
    whatsapp = COALESCE(profiles.whatsapp, EXCLUDED.whatsapp);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Garante que username não pode ser null (se ainda não estiver definido)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'username' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
  END IF;
END $$;
