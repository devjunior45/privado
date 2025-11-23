"use client"
import { JobPost } from "@/components/job-post"
import type { JobPostWithProfile } from "@/types/database"
import { EnhancedJobSkeleton } from "@/components/ui/enhanced-job-skeleton"
import useMobile from "@/hooks/use-mobile"
import { useState, useEffect, useRef } from "react"

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
  isDesktopLayout = false,
}: JobFeedProps) {
  const isMobile = useMobile()

  const [displayedPosts, setDisplayedPosts] = useState<typeof initialPosts>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)
  const POSTS_PER_PAGE = 5

  // Reset quando os posts iniciais mudarem (filtros, etc)
  useEffect(() => {
    setDisplayedPosts(initialPosts.slice(0, POSTS_PER_PAGE))
    setCurrentPage(1)
  }, [initialPosts])

  // Intersection Observer para detectar quando chegar ao final
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasLoadedOnce) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 },
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [isLoadingMore, displayedPosts, initialPosts, hasLoadedOnce])

  const loadMorePosts = () => {
    const totalPosts = initialPosts.length
    const currentDisplayed = displayedPosts.length

    if (currentDisplayed >= totalPosts) return

    setIsLoadingMore(true)

    setTimeout(() => {
      const nextPage = currentPage + 1
      const newPosts = initialPosts.slice(0, nextPage * POSTS_PER_PAGE)
      setDisplayedPosts(newPosts)
      setCurrentPage(nextPage)
      setIsLoadingMore(false)
    }, 500)
  }

  const hasMore = displayedPosts.length < initialPosts.length

  if (isLoading && !hasLoadedOnce) {
    return (
      <div className={` ${isMobile ? "space-y-1" : "space-y-4"}`}>
        {[...Array(isMobile ? 3 : 5)].map((_, index) => (
          <EnhancedJobSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!isLoading && initialPosts.length === 0 && hasLoadedOnce) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Nenhuma vaga encontrada.</p>
        <p className="text-sm text-muted-foreground mt-2">Tente ajustar seus filtros ou expandir sua busca.</p>
      </div>
    )
  }

  return (
    <div className={isMobile ? "space-y-0.5 bg-muted/20" : "space-y-4"}>
      {displayedPosts.map((post, index) => (
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

      {hasMore && (
        <div ref={observerTarget} className="py-8 flex justify-center">
          {isLoadingMore && (
            <div className="space-y-4 w-full">
              {[...Array(2)].map((_, index) => (
                <EnhancedJobSkeleton key={`loading-${index}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {!hasMore && displayedPosts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">Todas as vagas foram carregadas</div>
      )}
    </div>
  )
}
