import { CompleteProfileForm } from "@/components/auth/complete-profile-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function CompleteProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verificar se o perfil já está completo
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, user_type, city_id, full_name, email, avatar_url")
    .eq("id", user.id)
    .single()

  console.log("Complete Profile - Perfil carregado:", profile)

  // Verificar se perfil está realmente completo
  const isComplete = profile && profile.user_type && profile.city_id

  console.log("Complete Profile - Está completo?", isComplete)

  if (isComplete) {
    console.log("Complete Profile - Redirecionando para feed")
    redirect("/feed")
  }

  // Determinar se veio do Google OAuth
  const isGoogleAuth = user.app_metadata?.provider === "google"

  console.log("Complete Profile - É Google Auth?", isGoogleAuth)

  return (
    <div className="min-h-screen bg-background">
      <CompleteProfileForm user={user} existingProfile={profile} isGoogleAuth={isGoogleAuth} />
    </div>
  )
}
