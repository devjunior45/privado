import { Header } from "@/components/header"
import { CreateJobForm } from "@/components/jobs/create-job-form"
import { PageContainer } from "@/components/page-container"
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
      <Header title="Nova Vaga" showSettings={false} isLoggedIn={true} showBackButton={true} />
      <div className="md:pt-0 mx-4 md:mx-0">
        <PageContainer>
          <div className="md:max-w-2xl md:mx-auto">
            <div className="hidden md:block mb-6">
              <h1 className="text-2xl font-bold">Nova Vaga</h1>
              <p className="text-muted-foreground">Crie uma nova vaga para sua empresa</p>
            </div>
            <CreateJobForm />
          </div>
        </PageContainer>
      </div>
    </div>
  )
}
