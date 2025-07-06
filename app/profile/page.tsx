import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ProfileView } from "@/components/profile/profile-view"
import { Button } from "@/components/ui/button"
import { User, FileText, Briefcase } from "lucide-react"
import Link from "next/link"
import { RecruiterOwnProfile } from "@/components/profile/recruiter-own-profile"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Perfil" showSettings={false} isLoggedIn={false} />
        <div className="mx-4 md:mx-0">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
            <div className="mb-8 flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Crie seu perfil profissional</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Tenha um perfil completo e um currículo pronto para participar de vagas e se destacar no mercado de
                trabalho.
              </p>

              <div className="space-y-3 mb-8 flex flex-col items-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  <span>Currículo automático em PDF</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Histórico de candidaturas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <User className="w-4 h-4 text-primary" />
                  <span>Perfil público para recrutadores</span>
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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Perfil" showSettings={true} isLoggedIn={true} />
        <div className="mx-4 md:mx-0">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
            <p>Erro ao carregar perfil</p>
          </div>
        </div>
      </div>
    )
  }

  // Se for recrutador, buscar suas vagas para mostrar na visualização própria
  if (profile.user_type === "recruiter") {
    const { data: jobPosts } = await supabase
      .from("job_posts")
      .select(`
        *,
        profiles!job_posts_author_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          company_name,
          company_location,
          city_id
        )
      `)
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })

    return <RecruiterOwnProfile profile={profile} jobPosts={jobPosts || []} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Perfil" showSettings={true} isLoggedIn={true} />
      <div className="mx-4 md:mx-0">
        <ProfileView profile={profile} isOwnProfile={true} />
      </div>
    </div>
  )
}
