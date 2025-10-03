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

  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).single()

  if (!profile || profile.user_type !== "recruiter") {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header mobile */}
      <Header title="Nova Vaga" showSettings={false} isLoggedIn={true} showBackButton={true} />

      {/* Header desktop */}
      <CreateJobHeader />

      <div className="mx-4 md:mx-0">
        <PageContainer>
          <CreateJobForm />
        </PageContainer>
      </div>
    </div>
  )
}
