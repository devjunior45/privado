"use client"
import { JobPost } from "@/components/job-post"
import type { JobPostWithProfile } from "@/types/database"
import { EnhancedJobSkeleton } from "@/components/ui/enhanced-job-skeleton"
import useMobile from "@/hooks/use-mobile"

interface JobFeedProps {
  isLoggedIn: boolean
  initialPosts: (JobPostWithProfile & {
    is_liked?: boolean
    is_saved?: boolean
    has_applied?: boolean
    application_date?: string | null
  })[]
  userProfile: any
  isLoading: boolean
  hasLoadedOnce: boolean
  highlightedPostId?: string | null
  isDesktopLayout?: boolean
}

export function JobFeed({
  isLoggedIn,
  initialPosts,
  userProfile,
  isLoading,
  hasLoadedOnce,
  highlightedPostId,
  isDesktopLayout = false, // This prop is now effectively unused for layout here
}: JobFeedProps) {
  const isMobile = useMobile()
  const posts = initialPosts

  if (isLoading && !hasLoadedOnce) {
    return (
      <div className={` ${isMobile ? "space-y-1" : "space-y-4"}`}>
        {[...Array(isMobile ? 3 : 6)].map((_, index) => (
          <EnhancedJobSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!isLoading && posts.length === 0 && hasLoadedOnce) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Nenhuma vaga encontrada.</p>
        <p className="text-sm text-muted-foreground mt-2">Tente ajustar seus filtros ou expandir sua busca.</p>
      </div>
    )
  }

  // On mobile, remove the outer div's space-y-4 to let JobPost handle its own margins or lack thereof
  // On desktop, keep space-y-4 for separation if JobPost doesn't have bottom margin
  return (
    <div className={isMobile ? "space-y-0.5 bg-muted/20" : "space-y-4"}>
      {posts.map((post, index) => (
        <JobPost
          key={post.id}
          jobPost={post}
          profile={post.profiles}
          isLoggedIn={isLoggedIn}
          userProfile={userProfile}
          isLikedInitially={post.is_liked}
          isSavedInitially={post.is_saved}
          hasAppliedInitially={post.has_applied}
          applicationDate={post.application_date}
          className={`animate-fadeInUp ${highlightedPostId === post.id ? "post-highlight" : ""}`}
          style={{ animationDelay: `${index * 100}ms` }}
          id={`post-${post.id}`}
        />
      ))}
    </div>
  )
}
