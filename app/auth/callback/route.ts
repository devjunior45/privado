import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se o perfil já está completo
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, city_id")
        .eq("id", data.user.id)
        .single()

      // Se não tem user_type ou city_id, precisa completar o cadastro
      if (!profile?.user_type || !profile?.city_id) {
        return NextResponse.redirect(`${origin}/complete-profile`)
      }

      // Se já está completo, vai para o feed
      return NextResponse.redirect(`${origin}/feed`)
    }
  }

  // Se houver erro, volta para login
  return NextResponse.redirect(`${origin}/login?error=Erro ao autenticar com Google`)
}
