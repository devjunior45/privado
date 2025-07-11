import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateUniqueUsername } from "@/utils/username-generator"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/feed"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Verificar se o usuário já tem um perfil
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("id", data.user.id)
        .single()

      // Se não existe perfil, criar um novo
      if (!existingProfile) {
        try {
          // Extrair informações do usuário do Google
          const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || "Usuario"
          const email = data.user.email || ""

          // Gerar username único
          const username = await generateUniqueUsername(fullName)

          // Criar perfil
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            username: username,
            full_name: fullName,
            email: email,
            user_type: "candidate", // Padrão como candidato
            avatar_url: data.user.user_metadata?.avatar_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (profileError) {
            console.error("Erro ao criar perfil:", profileError)
            return NextResponse.redirect(`${origin}/login?error=Erro ao criar perfil`)
          }

          console.log(`Perfil criado para usuário Google: ${username}`)
        } catch (error) {
          console.error("Erro no processo de criação do perfil:", error)
          return NextResponse.redirect(`${origin}/login?error=Erro interno`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
