import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreateJobForm } from "@/components/jobs/create-job-form"
import { CreateJobHeader } from "@/components/jobs/create-job-header"
import { Header } from "@/components/header"

export default async function CreateJobPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from("profiles").select("user_type, is_verified").eq("id", user.id).single()

  // Verificar se é recrutador
  if (profile?.user_type !== "recruiter") {
    redirect("/feed")
  }

  // Contar vagas ativas apenas se não for verificado
  let activeJobsCount = 0
  if (!profile.is_verified) {
    const { count } = await supabase
      .from("job_posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("status", "active")

    activeJobsCount = count || 0
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header mobile */}
      <Header title="Nova Vaga" showBack />

      {/* Header desktop */}
      <CreateJobHeader />

      {/* Formulário */}
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <CreateJobForm isVerified={profile.is_verified || false} activeJobsCount={activeJobsCount} />
      </div>
    </div>
  )
}
