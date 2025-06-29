import { createClient } from "@/lib/supabase/server"
import { AuthForm } from "@/components/auth/auth-form"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Se o usuário estiver logado, redirecionar para o feed
  if (user) {
    redirect("/feed")
  }

  return <AuthForm />
}
