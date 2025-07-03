import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Clock, CheckCircle, XCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Candidaturas" showSettings={false} isLoggedIn={false} />
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

              <div className="space-y-3 mb-8">
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

  // Buscar candidaturas do usuário
  const { data: applications } = await supabase
    .from("job_applications")
    .select(`
      id,
      status,
      applied_at,
      job_posts (
        id,
        title,
        company,
        location,
        job_type,
        profiles (
          username,
          full_name,
          company_name
        )
      )
    `)
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "accepted":
        return <CheckCircle className="w-4 h-4" />
      case "rejected":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "accepted":
        return "Aceita"
      case "rejected":
        return "Rejeitada"
      default:
        return "Pendente"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Minhas Candidaturas" showSettings={false} isLoggedIn={true} />
      <div className="mx-4 md:mx-0">
        <div className="py-4 space-y-4">
          {applications && applications.length > 0 ? (
            applications.map((application: any) => (
              <Card key={application.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{application.job_posts.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {application.job_posts.profiles?.company_name || application.job_posts.company}
                      </p>
                      <p className="text-sm text-muted-foreground">{application.job_posts.location}</p>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(application.status)}
                        {getStatusText(application.status)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Candidatura enviada{" "}
                      {formatDistanceToNow(new Date(application.applied_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    <Badge variant="outline">{application.job_posts.job_type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma candidatura ainda</h3>
              <p className="text-muted-foreground mb-4">Comece a se candidatar às vagas que te interessam</p>
              <Link href="/feed">
                <Button>Ver Vagas Disponíveis</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
