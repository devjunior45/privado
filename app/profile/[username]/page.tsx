import { createClient } from "@/lib/supabase/server"
import { ProfileView } from "@/components/profile/profile-view"
import { RecruiterPublicView } from "@/components/profile/recruiter-public-view"
import { notFound } from "next/navigation"
import type { JobPostWithProfile } from "@/types/database"
import { Header } from "@/components/header"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const supabase = await createClient()

  // Buscar perfil do usuário
  const { data: profile } = await supabase.from("profiles").select("*").eq("username", params.username).single()

  if (!profile) {
    notFound()
  }

  // Verificar se usuário está logado
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // Buscar perfil do usuário logado para comparação
  let userProfile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    userProfile = data
  }

  // Verificar se é o próprio perfil
  const isOwnProfile = userProfile?.username === params.username

  const isRecruiter = profile.user_type === "recruiter"

  // Se for recrutador, buscar suas vagas
  let jobPosts: JobPostWithProfile[] = []
  if (isRecruiter) {
    const { data: posts } = await supabase
      .from("job_posts")
      .select(
        `
        *,
        profiles (
          id,
          username,
          full_name,
          avatar_url,
          whatsapp,
          user_type,
          company_name
        )
      `,
      )
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })

    // Se o usuário estiver logado, buscar suas curtidas
    let likedPostIds = new Set<string>()
    if (isLoggedIn && user) {
      const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id)
      likedPostIds = new Set(likes?.map((like) => like.post_id) || [])
    }

    jobPosts =
      posts?.map((post) => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
      })) || []
  }

  // Sempre usar a visualização pública para recrutadores (mesmo para próprio perfil)
  if (isRecruiter) {
    return (
      <RecruiterPublicView profile={profile} jobPosts={jobPosts} isLoggedIn={isLoggedIn} isOwnProfile={isOwnProfile} />
    )
  }

  // Para candidatos, usar a visualização normal com header
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      <Header title={`@${profile.username}`} showBackButton={true} isLoggedIn={isLoggedIn} />
      <div className="max-w-md mx-auto px-4 py-6">
        <ProfileView profile={profile} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  )
}
