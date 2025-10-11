import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Pause, X, Briefcase, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import { CityDisplay } from "@/components/ui/city-display"

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="md:hidden">
          <PageHeader title="Candidaturas" />
        </div>
        <div className="mx-4 md:mx-0">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
            <div className="mb-8">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Briefcase className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Acompanhe suas candidaturas</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Tenha controle total sobre suas aplicações e acompanhe o status de cada processo seletivo.
              </p>

              <div className="space-y-3 mb-8 flex flex-col items-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Histórico completo de candidaturas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>Status em tempo real</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Lembretes de follow-up</span>
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

  // Buscar perfil do usuário para cidade padrão
  const { data: userProfile } = await supabase.from("profiles").select("city_id").eq("id", user.id).single()

  // Buscar candidaturas do usuário com informações da vaga
  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      `
      *,
      job_posts (
        id,
        title,
        company,
        location,
        salary,
        description,
        image_url,
        background_color,
        city_id,
        status
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

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

  return (
    <PageContainer header={<PageHeader title="Minhas Candidaturas" userProfile={userProfile} />}>
      {!applications || applications.length === 0 ? (
        <div className="text-center py-12 mx-4">
          <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Você ainda não se candidatou a nenhuma vaga.</p>
          <Button asChild className="mt-4">
            <Link href="/feed">Ver Vagas Disponíveis</Link>
          </Button>
        </div>
      ) : (
        <div className="mx-4 md:mx-0">
          {/* Grade de 3 colunas no desktop, lista no mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {applications.map((application) => (
              <Card
                key={application.id}
                className={`hover:shadow-md transition-shadow aspect-square md:aspect-square flex flex-col ${
                  application.job_posts.status !== "active" ? "opacity-75" : ""
                }`}
              >
                <CardHeader className="pb-2 flex-shrink-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-sm md:text-base truncate">{application.job_posts.title}</CardTitle>
                        {getStatusBadge(application.job_posts.status)}
                      </div>
                      <p className="text-blue-600 font-medium text-sm truncate">{application.job_posts.company}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        <CityDisplay cityId={application.job_posts.city_id} fallback={application.job_posts.location} />
                      </span>
                    </div>

                    {application.job_posts.salary && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Salário:</span>
                        <span className="truncate">{application.job_posts.salary}</span>
                      </div>
                    )}

                    {application.job_posts.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{application.job_posts.description}</p>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        Candidatou-se em {new Date(application.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {application.message && (
                      <div className="mt-2 p-2 bg-muted rounded-md">
                        <p className="text-xs font-medium mb-1">Sua mensagem:</p>
                        <p className="text-xs line-clamp-2">{application.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 mt-auto">
                    {application.job_posts.status === "active" ? (
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent text-xs">
                        <Link href={`/post/${application.job_posts.id}`}>Ver Vaga</Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="flex-1 bg-transparent text-xs">
                        {application.job_posts.status === "paused" ? "Vaga Pausada" : "Vaga Encerrada"}
                      </Button>
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
