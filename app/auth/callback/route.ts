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
      // Buscar perfil existente
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, username, user_type, city_id, full_name")
        .eq("id", data.user.id)
        .single()

      console.log("Perfil encontrado:", existingProfile)

      // Verificar se perfil está completo
      const isProfileComplete = existingProfile && existingProfile.user_type && existingProfile.city_id

      console.log("Perfil completo?", isProfileComplete)

      if (!isProfileComplete) {
        // Se não existe perfil, criar um básico
        if (!existingProfile) {
          console.log("Criando perfil básico para novo usuário")
          const { error: insertError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
            avatar_url: data.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            console.error("Erro ao criar perfil básico:", insertError)
          }
        }

        console.log("Redirecionando para complete-profile")
        return NextResponse.redirect(`${origin}/complete-profile`)
      }

      // Se perfil está completo, ir para o feed
      console.log("Perfil completo, indo para feed")
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error("Erro na autenticação:", error)
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
