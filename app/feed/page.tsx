import { createClient } from "@/lib/supabase/server"
import { JobFeed } from "@/components/job-feed"
import { PageContainer } from "@/components/page-container"
import { getPosts } from "@/app/actions/posts"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface SearchParams {
  q?: string
  city?: string
  salary?: string
  sectors?: string
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar perfil do usuário
  const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Verificar cidade selecionada
  const selectedCityId = searchParams.city ? Number.parseInt(searchParams.city) : userProfile?.city_id

  // Buscar posts com ranking aplicado
  let posts = await getPosts(selectedCityId || null, user.id)

  // Aplicar filtros adicionais
  if (searchParams.q) {
    const query = searchParams.q.toLowerCase()
    posts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.company.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query),
    )
  }

  if (searchParams.salary) {
    const salaryRanges = searchParams.salary.split(",")
    posts = posts.filter((post) => {
      if (!post.salary) return false
      const salary = post.salary.toLowerCase()
      return salaryRanges.some((range) => {
        if (range === "0-2000") return salary.includes("1") || salary.includes("2000")
        if (range === "2000-4000") return salary.includes("2") || salary.includes("3") || salary.includes("4000")
        if (range === "4000-6000") return salary.includes("4") || salary.includes("5") || salary.includes("6000")
        if (range === "6000+") return salary.includes("6") || salary.includes("7") || salary.includes("8")
        return false
      })
    })
  }

  if (searchParams.sectors) {
    const sectorIds = searchParams.sectors.split(",").map(Number)
    posts = posts.filter((post) => {
      if (!post.sector_ids || post.sector_ids.length === 0) return false
      return post.sector_ids.some((id: number) => sectorIds.includes(id))
    })
  }

  // Buscar posts salvos
  const { data: savedPosts } = await supabase.from("saved_jobs").select("job_post_id").eq("user_id", user.id)

  const savedPostIds = new Set(savedPosts?.map((sp) => sp.job_post_id) || [])

  // Buscar candidaturas
  const { data: applications } = await supabase
    .from("job_applications")
    .select("job_post_id, created_at")
    .eq("user_id", user.id)

  const applicationsMap = new Map(applications?.map((app) => [app.job_post_id, app.created_at]) || [])

  // Adicionar informações de salvos e candidaturas
  const postsWithEngagement = posts.map((post) => ({
    ...post,
    is_saved: savedPostIds.has(post.id),
    has_applied: applicationsMap.has(post.id),
    application_date: applicationsMap.get(post.id) || null,
  }))

  return (
    <PageContainer>
      <JobFeed
        isLoggedIn={true}
        initialPosts={postsWithEngagement}
        userProfile={userProfile}
        isLoading={false}
        hasLoadedOnce={true}
      />
    </PageContainer>
  )
}
