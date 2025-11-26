import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Bookmark, Heart, Search } from "lucide-react"
import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import { SavedJobCard } from "@/components/saved/saved-job-card"

async function getSavedJobsWithApplications() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Buscar vagas salvas com informações de candidatura
  const { data: savedJobs, error } = await supabase
    .from("saved_jobs")
    .select(
      `
      *,
      job_posts (
        id,
        title,
        company,
        location,
        city_id,
        salary,
        description,
        image_url,
        background_color,
        created_at,
        likes_count,
        status
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar vagas salvas:", error)
    return []
  }

  if (!savedJobs || savedJobs.length === 0) {
    return []
  }

  // Buscar candidaturas do usuário para essas vagas
  const jobIds = savedJobs.map((job) => job.job_posts.id)

  let applications = []
  try {
    // Tentar diferentes estruturas de tabela
    const queries = [
      // Estrutura padrão: job_id + user_id
      supabase
        .from("job_applications")
        .select("job_id, created_at")
        .eq("user_id", user.id)
        .in("job_id", jobIds),

      // Estrutura alternativa: post_id + user_id
      supabase
        .from("job_applications")
        .select("post_id, created_at")
        .eq("user_id", user.id)
        .in("post_id", jobIds),

      // Estrutura legado: job_id + candidate_id
      supabase
        .from("job_applications")
        .select("job_id, created_at")
        .eq("candidate_id", user.id)
        .in("job_id", jobIds),
    ]

    for (const query of queries) {
      const { data, error } = await query
      if (!error && data) {
        applications = data
        console.log("✅ Candidaturas encontradas:", applications.length)
        break
      }
    }
  } catch (error) {
    console.error("❌ Erro ao buscar candidaturas:", error)
  }

  // Mapear candidaturas para as vagas salvas
  const savedJobsWithApplications = savedJobs.map((savedJob) => {
    const application = applications.find(
      (app) => app.job_id === savedJob.job_posts.id || app.post_id === savedJob.job_posts.id,
    )

    return {
      ...savedJob,
      has_applied: !!application,
      application_date: application?.created_at || null,
    }
  })

  return savedJobsWithApplications
}

export default async function SavedJobsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="md:hidden">
          <PageHeader title="Salvos" />
        </div>
        <div className="mx-4 md:mx-0">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
            <div className="mb-8">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Bookmark className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Salve suas vagas favoritas</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Organize e acompanhe as oportunidades que mais te interessam. Nunca mais perca uma vaga importante!
              </p>

              <div className="space-y-3 mb-8 flex flex-col items-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4 text-primary" />
                  <span>Salve vagas com um toque</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Search className="w-4 h-4 text-primary" />
                  <span>Acesse rapidamente suas favoritas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <span>Organize por categorias</span>
                </div>
              </div>
            </div>

            <Link href="/login">
              <Button size="lg" className="w-full max-w-sm">
                Criar Conta ou Entrar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Buscar perfil do usuário para cidade padrão e tipo de usuário
  const { data: userProfile } = await supabase.from("profiles").select("city_id, user_type").eq("id", user.id).single()

  const savedJobs = await getSavedJobsWithApplications()

  const isRecruiter = userProfile?.user_type === "recruiter"

  return (
    <PageContainer header={<PageHeader title="Vagas Salvas" userProfile={userProfile} />}>
      {!savedJobs || savedJobs.length === 0 ? (
        <div className="text-center py-12 mx-4">
          <Bookmark className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">Você ainda não salvou nenhuma vaga.</p>
          <p className="text-sm text-muted-foreground mb-4">
            Salve vagas interessantes para acessá-las rapidamente depois.
          </p>
          <Button asChild>
            <Link href="/feed">Explorar Vagas</Link>
          </Button>
        </div>
      ) : (
        <div className="mx-4 md:mx-0">
          {/* Grade de 3 colunas no desktop, lista no mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedJobs.map((savedJob) => (
              // Use new SavedJobCard component
              <SavedJobCard key={savedJob.id} savedJob={savedJob} isRecruiter={isRecruiter} />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
