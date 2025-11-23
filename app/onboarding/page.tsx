import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OnboardingQuiz } from "@/components/onboarding/onboarding-quiz"
import { isProfileComplete } from "@/utils/check-profile-complete"
import { JobFeed } from "@/components/job-feed"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

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

  const { data: previewPosts } = await supabase
    .from("job_posts")
    .select(
      `*, sector_ids, profiles (id, username, full_name, avatar_url, whatsapp, user_type, company_name, is_verified)`,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 overflow-hidden">
        <div className="blur-md opacity-30 pointer-events-none p-4">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            }
          >
            <JobFeed
              isLoggedIn={false}
              initialPosts={previewPosts || []}
              userProfile={null}
              isLoading={false}
              hasLoadedOnce={true}
              isDesktopLayout={false}
            />
          </Suspense>
        </div>
      </div>

      <div className="relative z-10">
        <OnboardingQuiz />
      </div>
    </div>
  )
}
