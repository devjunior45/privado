import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare, Download, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { CityDisplay } from "@/components/ui/city-display"

interface PlatformApplicationsListProps {
  recruiterId: string
  jobId?: string
}

export async function PlatformApplicationsList({ recruiterId, jobId }: PlatformApplicationsListProps) {
  const supabase = await createClient()

  // Buscar vagas do recrutador
  const jobsQuery = supabase
    .from("job_posts")
    .select("id, title, company, location, city_id")
    .eq("author_id", recruiterId)

  if (jobId) {
    jobsQuery.eq("id", jobId)
  }

  const { data: jobs } = await jobsQuery

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Nenhuma vaga encontrada.</p>
        </CardContent>
      </Card>
    )
  }

  // Buscar candidaturas da plataforma para as vagas do recrutador
  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      `
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url,
        whatsapp,
        city_id,
        professional_summary,
        skills
      ),
      job_posts (
        id,
        title,
        company,
        location,
        city_id
      )
    `,
    )
    .in(
      "post_id",
      jobs.map((job) => job.id),
    )
    .eq("application_type", "platform")
    .order("created_at", { ascending: false })

  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-2">Nenhuma candidatura pela plataforma ainda.</p>
          <p className="text-sm text-muted-foreground">
            As candidaturas enviadas pela plataforma aparecerão aqui com os currículos anexados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {applications.map((application) => (
        <Card key={application.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage
                  src={application.profiles.avatar_url || "/placeholder.svg"}
                  alt={application.profiles.full_name || ""}
                />
                <AvatarFallback>
                  {(application.profiles.full_name || application.profiles.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/profile/${application.profiles.username}`} className="font-medium hover:underline">
                      {application.profiles.full_name || application.profiles.username}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Candidatou-se para: <span className="font-medium">{application.job_posts.title}</span>
                    </p>
                    {application.profiles.city_id && (
                      <p className="text-xs text-muted-foreground">
                        <CityDisplay cityId={application.profiles.city_id} />
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(application.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <FileText className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">Plataforma</span>
                    </div>
                  </div>
                </div>

                {/* Resumo profissional */}
                {application.profiles.professional_summary && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium mb-1">Resumo Profissional:</p>
                    <p className="text-sm">{application.profiles.professional_summary}</p>
                  </div>
                )}

                {/* Habilidades */}
                {application.profiles.skills && application.profiles.skills.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Habilidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {application.profiles.skills.slice(0, 5).map((skill, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                      {application.profiles.skills.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{application.profiles.skills.length - 5}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Mensagem da candidatura */}
                {application.message && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs font-medium mb-1">Mensagem do candidato:</p>
                    <p className="text-sm">{application.message}</p>
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${application.profiles.username}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Perfil
                    </Link>
                  </Button>

                  {/* Botão para baixar currículo */}
                  {application.resume_pdf_url && (
                    <Button size="sm" asChild>
                      <a href={application.resume_pdf_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Currículo
                      </a>
                    </Button>
                  )}

                  {application.profiles.whatsapp && (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://wa.me/${application.profiles.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
