import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { JobPost } from "@/components/job-post"
import { Button } from "@/components/ui/button"
import { Bookmark, Heart, Search } from "lucide-react"
import Link from "next/link"

export default async function SavedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Salvos" showSettings={false} isLoggedIn={false} />
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

              <div className="space-y-3 mb-8">
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

  // Buscar vagas salvas do usuário
  const { data: savedJobs } = await supabase
    .from("saved_jobs")
    .select(`
      job_posts (
        id,
        title,
        company,
        location,
        salary_min,
        salary_max,
        job_type,
        description,
        requirements,
        benefits,
        created_at,
        profiles (
          username,
          full_name,
          company_name
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header title="Vagas Salvas" showSettings={false} isLoggedIn={true} />
      <div className="mx-4 md:mx-0">
        <div className="py-4 space-y-4">
          {savedJobs && savedJobs.length > 0 ? (
            savedJobs.map((savedJob: any) => (
              <JobPost key={savedJob.job_posts.id} post={savedJob.job_posts} currentUserId={user.id} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bookmark className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhuma vaga salva</h3>
              <p className="text-muted-foreground mb-4">
                Comece a salvar vagas que te interessam para acessá-las rapidamente
              </p>
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
