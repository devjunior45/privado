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
        .select("id, username, user_type, city_id, full_name")
        .eq("id", data.user.id)
        .single()

      // Verificar se é login social (Google) sem perfil completo
      const isGoogleLogin = data.user.app_metadata.provider === "google"

      if (isGoogleLogin) {
        // Para login social, só redireciona para complete-profile se não tiver dados básicos
        if (!existingProfile || !existingProfile.user_type || !existingProfile.city_id || !existingProfile.username) {
          return NextResponse.redirect(`${origin}/complete-profile`)
        }
      }

      // Para login com email ou perfil já completo, ir para o feed
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
