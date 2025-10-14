import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/feed"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se o usuário já tem um perfil completo
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, username, user_type, city_id")
        .eq("id", data.user.id)
        .single()

      // Se não existe perfil ou está incompleto, redirecionar para completar
      if (!existingProfile || !existingProfile.user_type || !existingProfile.city_id) {
        return NextResponse.redirect(`${origin}/complete-profile`)
      }

      // Se tudo está completo, ir para o feed
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
