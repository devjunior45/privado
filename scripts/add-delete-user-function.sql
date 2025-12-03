-- Função para deletar usuário do auth.users
-- Deve ser executada no Supabase SQL Editor com permissões de administrador

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inverte a ordem: primeiro deleta de profiles, depois de auth.users
  -- Isso resolve o erro "violates foreign key constraint profiles_id_fkey"
  
  -- 1. Deletar perfil primeiro (tabela que tem a foreign key)
  DELETE FROM public.profiles WHERE id = auth.uid();
  
  -- 2. Depois deletar usuário do auth (tabela referenciada pela foreign key)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Garantir que apenas usuários autenticados podem executar
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

COMMENT ON FUNCTION delete_user() IS 'Permite que um usuário autenticado delete sua própria conta do sistema de autenticação. Deleta primeiro o perfil (profiles) e depois o usuário (auth.users) para evitar violação de foreign key constraint.';
