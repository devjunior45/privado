import { Header } from "@/components/header"
import { CreateJobForm } from "@/components/jobs/create-job-form"
import { PageContainer } from "@/components/page-container"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateJobHeader } from "@/components/jobs/create-job-header"

export default async function CreateJobPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("user_type, is_verified").eq("id", user.id).single()

  if (!profile || profile.user_type !== "recruiter") {
    redirect("/")
  }

  // Verificar se é não verificado e quantas vagas ativas tem
  let canCreateJob = true
  let activeJobsCount = 0

  if (profile.is_verified === false) {
    const { data: activeJobs, error } = await supabase
      .from("job_posts")
      .select("id", { count: "exact" })
      .eq("author_id", user.id)
      .eq("status", "active")

    if (!error && activeJobs) {
      activeJobsCount = activeJobs.length
      canCreateJob = activeJobsCount < 1
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header mobile */}
      <Header title="Nova Vaga" showSettings={false} isLoggedIn={true} showBackButton={true} />

      {/* Header desktop */}
      <CreateJobHeader />

      <div className="mx-4 md:mx-0">
        <PageContainer>
          <CreateJobForm isVerified={profile.is_verified || false} canCreateJob={canCreateJob} />
        </PageContainer>
      </div>
    </div>
  )
}
