import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { JobFeed } from "@/components/job-feed"
import { PageContainer } from "@/components/page-container"
import { JobFilters } from "@/components/jobs/job-filters"
import { EnhancedJobSkeleton } from "@/components/ui/enhanced-job-skeleton"

interface SearchParams {
  search?: string
  city?: string
  sector?: string
  type?: string
  experience?: string
  page?: string
}

async function FeedContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    userProfile = profile
  }

  // Build query
  let query = supabase
    .from("job_posts")
    .select(`
      *,
      profiles!job_posts_author_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        company_name,
        is_verified
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Apply filters
  if (searchParams.search) {
    query = query.or(
      `title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%,company.ilike.%${searchParams.search}%`,
    )
  }

  if (searchParams.city && searchParams.city !== "all") {
    query = query.eq("city_id", searchParams.city)
  }

  if (searchParams.sector && searchParams.sector !== "all") {
    query = query.contains("sectors", [searchParams.sector])
  }

  if (searchParams.type && searchParams.type !== "all") {
    query = query.eq("job_type", searchParams.type)
  }

  if (searchParams.experience && searchParams.experience !== "all") {
    query = query.eq("experience_level", searchParams.experience)
  }

  const { data: posts, error } = await query

  if (error) {
    console.error("Error fetching posts:", error)
    return <div>Erro ao carregar vagas</div>
  }

  // Get user interactions if logged in
  let postsWithInteractions = posts || []
  if (user && posts) {
    const postIds = posts.map((post) => post.id)

    // Get likes
    const { data: likes } = await supabase
      .from("job_likes")
      .select("job_post_id")
      .eq("user_id", user.id)
      .in("job_post_id", postIds)

    // Get saved jobs
    const { data: savedJobs } = await supabase
      .from("saved_jobs")
      .select("job_post_id")
      .eq("user_id", user.id)
      .in("job_post_id", postIds)

    // Get applications
    const { data: applications } = await supabase
      .from("job_applications")
      .select("job_post_id, created_at")
      .eq("user_id", user.id)
      .in("job_post_id", postIds)

    const likedPostIds = new Set(likes?.map((like) => like.job_post_id) || [])
    const savedPostIds = new Set(savedJobs?.map((saved) => saved.job_post_id) || [])
    const applicationMap = new Map(applications?.map((app) => [app.job_post_id, app.created_at]) || [])

    postsWithInteractions = posts.map((post) => ({
      ...post,
      is_liked: likedPostIds.has(post.id),
      is_saved: savedPostIds.has(post.id),
      has_applied: applicationMap.has(post.id),
      application_date: applicationMap.get(post.id) || null,
    }))
  }

  return (
    <JobFeed
      isLoggedIn={!!user}
      initialPosts={postsWithInteractions}
      userProfile={userProfile}
      isLoading={false}
      hasLoadedOnce={true}
    />
  )
}

export default function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <PageContainer className="pb-20 md:pb-0">
      {/* Mobile: sem padding lateral, cards ocupam 100% */}
      {/* Desktop: mantém padding normal */}
      <div className="md:px-6">
        <div className="hidden md:block mb-6">
          <JobFilters />
        </div>

        <Suspense
          fallback={
            <div className="space-y-0 md:space-y-4">
              {[...Array(6)].map((_, index) => (
                <EnhancedJobSkeleton key={index} />
              ))}
            </div>
          }
        >
          <FeedContent searchParams={searchParams} />
        </Suspense>
      </div>
    </PageContainer>
  )
}
