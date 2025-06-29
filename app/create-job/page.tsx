import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import { CreateJobForm } from "@/components/jobs/create-job-form"

export default async function CreateJobPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.user_type !== "recruiter") {
    redirect("/feed")
  }

  return (
    <PageContainer header={<PageHeader title="Publicar Nova Vaga" />}>
      <CreateJobForm profile={profile} />
    </PageContainer>
  )
}
