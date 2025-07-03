import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { JobPost } from "@/components/job-post"
import { PageContainer } from "@/components/page-container"
import { LoginPrompt } from "@/components/auth/login-prompt"

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
        status,
        profiles (
          full_name,
          username,
          user_type
        )
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
      <PageContainer>
        <div className="md:hidden">
          <Header title="Vagas Salvas" isLoggedIn={false} />
        </div>
        <div className="mx-4 md:mx-0 py-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl">🔖</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Salve suas vagas favoritas</h2>
              <p className="text-muted-foreground mb-4">
                Faça login para salvar vagas interessantes e acessá-las rapidamente depois
              </p>
            </div>
            <LoginPrompt />
          </div>
        </div>
      </PageContainer>
    )
  }

  const savedJobs = await getSavedJobsWithApplications()
  const jobs = savedJobs?.map((saved) => saved.job_posts).filter(Boolean) || []

  return (
    <PageContainer>
      <div className="md:hidden">
        <Header title="Vagas Salvas" isLoggedIn={true} />
      </div>
      <div className="mx-4 md:mx-0">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl">🔖</span>
            </div>
            <p className="text-muted-foreground mb-2">Você ainda não salvou nenhuma vaga.</p>
            <p className="text-sm text-muted-foreground">
              Salve vagas interessantes para acessá-las rapidamente depois.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job: any) => (
              <JobPost key={job.id} post={job} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
