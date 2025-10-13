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
    .select("id, username, user_type, city_id, full_name")
    .eq("id", user.id)
    .single()

  // Se já tem user_type e city_id, vai para o feed
  if (profile?.user_type && profile?.city_id) {
    redirect("/feed")
  }

  return (
    <div className="min-h-screen bg-background">
      <CompleteProfileForm user={user} existingProfile={profile} />
    </div>
  )
}
