import { Header } from "@/components/header"
import { CreateJobForm } from "@/components/jobs/create-job-form"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
      <Header title="Nova Vaga" showSettings={false} isLoggedIn={true} />
      <div className="mx-4 md:mx-0">
        <PageContainer>
          <PageHeader
            title="Publicar Nova Vaga"
            description="Preencha os dados da vaga para atrair os melhores candidatos"
          />
          <CreateJobForm />
        </PageContainer>
      </div>
    </div>
  )
}
