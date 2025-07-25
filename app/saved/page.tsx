import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Bookmark, Heart, Pause, X, CheckCircle, Search } from "lucide-react"
import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import { CityDisplay } from "@/components/ui/city-display"

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paused":
        return (
          <Badge variant="secondary" className="text-yellow-700 bg-yellow-100 text-xs">
            <Pause className="w-3 h-3 mr-1" />
            Pausada
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="secondary" className="text-red-700 bg-red-100 text-xs">
            <X className="w-3 h-3 mr-1" />
            Encerrada
          </Badge>
        )
      default:
        return null
    }
  }

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
              <Card
                key={savedJob.id}
                className={`hover:shadow-md transition-shadow aspect-square md:aspect-square flex flex-col ${
                  savedJob.job_posts.status !== "active" ? "opacity-75" : ""
                }`}
              >
                <CardHeader className="pb-2 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm md:text-base truncate">{savedJob.job_posts.title}</CardTitle>
                        {getStatusBadge(savedJob.job_posts.status)}
                      </div>
                      <p className="text-blue-600 font-medium text-sm truncate">{savedJob.job_posts.company}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Heart className="w-3 h-3" />
                      <span>{savedJob.job_posts.likes_count || 0}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        <CityDisplay cityId={savedJob.job_posts.city_id} fallback={savedJob.job_posts.location} />
                      </span>
                    </div>

                    {savedJob.job_posts.salary && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Salário:</span>
                        <span className="truncate">{savedJob.job_posts.salary}</span>
                      </div>
                    )}

                    {savedJob.job_posts.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{savedJob.job_posts.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        Salva em {new Date(savedJob.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {/* Mostrar status de candidatura apenas para candidatos */}
                    {!isRecruiter && savedJob.has_applied && (
                      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          Candidatou-se
                          {savedJob.application_date
                            ? ` em ${new Date(savedJob.application_date).toLocaleDateString("pt-BR")}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 mt-auto">
                    {savedJob.job_posts.status === "active" ? (
                      <>
                        <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent text-xs">
                          <Link href={`/post/${savedJob.job_posts.id}`}>Ver Vaga</Link>
                        </Button>
                        {/* Mostrar botão de candidatura apenas para candidatos */}
                        {!isRecruiter && (
                          <>
                            {!savedJob.has_applied ? (
                              <Button size="sm" asChild className="flex-1 text-xs">
                                <Link href={`/post/${savedJob.job_posts.id}`}>Candidatar-se</Link>
                              </Button>
                            ) : (
                              <Button size="sm" disabled className="flex-1 text-xs">
                                Já Candidatado
                              </Button>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" disabled className="flex-1 bg-transparent text-xs">
                          Ver Vaga
                        </Button>
                        {!isRecruiter && (
                          <Button size="sm" disabled className="flex-1 text-xs">
                            {savedJob.job_posts.status === "paused" ? "Vaga Pausada" : "Vaga Encerrada"}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  )
}
