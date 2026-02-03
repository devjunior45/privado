import { Header } from "@/components/header"
import { EditJobForm } from "@/components/jobs/edit-job-form"
import { PageContainer } from "@/components/page-container"
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { CreateJobHeader } from "@/components/jobs/create-job-header"

interface EditJobPageProps {
  params: Promise<{ id: string }>
}

export default async function EditJobPage({ params }: EditJobPageProps) {
  const { id } = await params
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

  // Buscar a vaga
  const { data: job, error } = await supabase
    .from("job_posts")
    .select("*")
    .eq("id", id)
    .eq("author_id", user.id)
    .single()

  if (error || !job) {
    notFound()
  }

  // Não permitir editar vagas encerradas
  if (job.status === "closed") {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header mobile */}
      <Header title="Editar Vaga" showSettings={false} isLoggedIn={true} showBackButton={true} />

      {/* Header desktop */}
      <CreateJobHeader title="Editar Vaga" />

      <div className="mx-4 md:mx-0">
        <PageContainer>
          <EditJobForm job={job} />
        </PageContainer>
      </div>
    </div>
  )
}
