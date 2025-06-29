import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"

interface JobApplicationsListProps {
  recruiterId: string
}

export async function JobApplicationsList({ recruiterId }: JobApplicationsListProps) {
  const supabase = await createClient()

  // Buscar vagas do recrutador
  const { data: jobs } = await supabase.from("job_posts").select("id").eq("author_id", recruiterId)

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Você ainda não recebeu candidaturas.</p>
        </CardContent>
      </Card>
    )
  }

  // Buscar candidaturas para as vagas do recrutador
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
        whatsapp
      ),
      job_posts (
        id,
        title,
        company,
        location
      )
    `,
    )
    .in(
      "post_id",
      jobs.map((job) => job.id),
    )
    .order("created_at", { ascending: false })

  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Você ainda não recebeu candidaturas.</p>
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
                <div className="flex justify-between">
                  <div>
                    <Link href={`/profile/${application.profiles.username}`} className="font-medium hover:underline">
                      {application.profiles.full_name || application.profiles.username}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Candidatou-se para: <span className="font-medium">{application.job_posts.title}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(application.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {application.message && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">{application.message}</p>
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/profile/${application.profiles.username}`}>Ver Perfil</Link>
                  </Button>

                  {application.profiles.whatsapp && (
                    <Button size="sm" className="ml-2" asChild>
                      <a
                        href={`https://wa.me/${application.profiles.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contatar
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
