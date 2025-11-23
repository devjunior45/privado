import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingQuiz } from "@/components/onboarding/onboarding-quiz"
import { isProfileComplete } from "@/utils/check-profile-complete"
import { JobFeed } from "@/components/job-feed"
import { sortJobsByImportance } from "@/utils/ranking"

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

  const { data: fetchedPosts } = await supabase
    .from("job_posts")
    .select(
      `*, sector_ids, profiles (id, username, full_name, avatar_url, whatsapp, user_type, company_name, is_verified)`,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10)

  const sortedPosts = fetchedPosts ? sortJobsByImportance(fetchedPosts) : []

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background com feed blur */}
      <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pt-20">
          <JobFeed
            isLoggedIn={false}
            initialPosts={sortedPosts}
            userProfile={null}
            isLoading={false}
            hasLoadedOnce={true}
            isDesktopLayout={false}
          />
        </div>
      </div>

      {/* Overlay semi-transparente */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 to-indigo-100/90 backdrop-blur-sm" />

      {/* Quiz em primeiro plano */}
      <div className="relative z-10">
        <OnboardingQuiz />
      </div>
    </div>
  )
}
