import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { JobPost } from "@/components/job-post"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PageProps {
  params: {
    id: string
  }
}

export default async function PostPage({ params }: PageProps) {
  const supabase = await createClient()

  // Buscar a postagem específica
  const { data: post, error } = await supabase
    .from("job_posts")
    .select(`*, profiles (id, username, full_name, avatar_url, whatsapp, user_type, company_name, is_verified)`)
    .eq("id", params.id)
    .single()

  if (error || !post) {
    notFound()
  }

  // Verificar se o usuário está logado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  let isLiked = false
  let isSaved = false
  let hasApplied = false
  let applicationDate = null

  if (user) {
    // Buscar perfil do usuário
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    userProfile = profile

    // Verificar se curtiu, salvou ou se candidatou
    const [likesResult, savedResult, applicationResult] = await Promise.all([
      supabase.from("post_likes").select("id").eq("post_id", params.id).eq("user_id", user.id).single(),
      supabase.from("saved_jobs").select("id").eq("post_id", params.id).eq("user_id", user.id).single(),
      supabase.from("job_applications").select("created_at").eq("job_id", params.id).eq("user_id", user.id).single(),
    ])

    isLiked = !!likesResult.data
    isSaved = !!savedResult.data
    hasApplied = !!applicationResult.data
    applicationDate = applicationResult.data?.created_at || null
  }

  const postWithEngagement = {
    ...post,
    is_liked: isLiked,
    is_saved: isSaved,
    has_applied: hasApplied,
    application_date: applicationDate,
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de navegação */}
      <div className="bg-white border-b sticky top-0 z-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="p-2">
            <Link href="/feed">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-semibold text-lg">Vaga</h1>
        </div>
      </div>

      {/* Postagem */}
      <div className="max-w-md mx-auto">
        <JobPost
          jobPost={postWithEngagement}
          profile={post.profiles}
          userProfile={userProfile}
          isLoggedIn={!!user}
          isLikedInitially={isLiked}
          isSavedInitially={isSaved}
          hasAppliedInitially={hasApplied}
          applicationDate={applicationDate}
        />
      </div>
    </div>
  )
}
