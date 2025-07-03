import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, CheckCircle } from "lucide-react"
import { PageContainer } from "@/components/page-container"
import { LoginPrompt } from "@/components/auth/login-prompt"
import { CityDisplay } from "@/components/ui/city-display"

async function getUserApplications() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Tentar diferentes estruturas de tabela para buscar candidaturas
  let applications = []
  try {
    const queries = [
      // Estrutura padrão: job_id + user_id
      supabase
        .from("job_applications")
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
            status,
            profiles (
              full_name,
              username
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Estrutura alternativa: post_id + user_id
      supabase
        .from("job_applications")
        .select(
          `
          *,
          job_posts!job_applications_post_id_fkey (
            id,
            title,
            company,
            location,
            city_id,
            salary,
            description,
            status,
            profiles (
              full_name,
              username
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),

      // Estrutura legado: job_id + candidate_id
      supabase
        .from("job_applications")
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
            status,
            profiles (
              full_name,
              username
            )
          )
        `,
        )
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false }),
    ]

    for (const query of queries) {
      const { data, error } = await query
      if (!error && data && data.length > 0) {
        applications = data
        console.log("✅ Candidaturas encontradas:", applications.length)
        break
      }
    }
  } catch (error) {
    console.error("❌ Erro ao buscar candidaturas:", error)
  }

  return applications
}

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <PageContainer>
        <div className="md:hidden">
          <Header title="Candidaturas" isLoggedIn={false} />
        </div>
        <div className="mx-4 md:mx-0 py-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Acompanhe suas candidaturas</h2>
              <p className="text-muted-foreground mb-4">
                Faça login para ver todas as vagas que você se candidatou e acompanhar o status
              </p>
            </div>
            <LoginPrompt />
          </div>
        </div>
      </PageContainer>
    )
  }

  const applications = await getUserApplications()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="text-green-700 bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativa
          </Badge>
        )
      case "paused":
        return (
          <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
            Pausada
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="secondary" className="text-red-700 bg-red-100">
            Encerrada
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <PageContainer>
      <div className="md:hidden">
        <Header title="Candidaturas" isLoggedIn={true} />
      </div>
      <div className="mx-4 md:mx-0">
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-muted-foreground mb-2">Você ainda não se candidatou a nenhuma vaga.</p>
            <p className="text-sm text-muted-foreground">
              Explore as vagas disponíveis e candidate-se às que mais combinam com você.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application: any) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{application.job_posts?.title}</CardTitle>
                        {getStatusBadge(application.job_posts?.status)}
                      </div>
                      <p className="text-blue-600 font-medium">{application.job_posts?.company}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <CityDisplay cityId={application.job_posts?.city_id} fallback={application.job_posts?.location} />
                    </div>

                    {application.job_posts?.salary && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Salário:</span>
                        <span>{application.job_posts.salary}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Candidatou-se em {new Date(application.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>

                    {application.job_posts?.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{application.job_posts.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
