import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingQuiz } from "@/components/onboarding/onboarding-quiz"
import { isProfileComplete } from "@/utils/check-profile-complete"

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Se o perfil já está completo, redirecionar para o feed
  if (profile && isProfileComplete(profile)) {
    redirect("/feed")
  }

  return <OnboardingQuiz />
}
