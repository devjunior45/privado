"use client"
import { JobPost } from "@/components/job-post"
import type { JobPostWithProfile } from "@/types/database"
import { EnhancedJobSkeleton } from "@/components/ui/enhanced-job-skeleton"
import useMobile from "@/hooks/use-mobile"
import { useEffect, useState, useRef } from "react"

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

  const [displayedCount, setDisplayedCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const posts = initialPosts.slice(0, displayedCount)
  const hasMore = displayedCount < initialPosts.length

  const loadMore = () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)

    if (containerRef.current) {
      document.body.style.overflow = "hidden"
    }

    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + 10, initialPosts.length))
      setIsLoadingMore(false)

      document.body.style.overflow = ""
    }, 800)
  }

  useEffect(() => {
    setDisplayedCount(10)
  }, [initialPosts.length])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: "100px" },
    )

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, displayedCount])

  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  if (isLoading && !hasLoadedOnce) {
    return (
      <div className={` ${isMobile ? "space-y-1" : "space-y-4"}`}>
        {[...Array(isMobile ? 3 : 6)].map((_, index) => (
          <EnhancedJobSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (!isLoading && initialPosts.length === 0 && hasLoadedOnce) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-muted-foreground">Não temos vagas neste local ainda.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Conhece alguém contratando na sua cidade? Indique o Busca Empregos!
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={isMobile ? "space-y-0.5 bg-muted/20" : "space-y-4"}>
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

      {hasMore && (
        <div ref={sentinelRef} className="py-4">
          {isLoadingMore && (
            <div className={isMobile ? "space-y-1" : "space-y-4"}>
              {[...Array(3)].map((_, index) => (
                <EnhancedJobSkeleton key={`loading-${index}`} />
              ))}
            </div>
          )}
        </div>
      )}

      {!hasMore && initialPosts.length > 10 && (
        <div className="text-center py-8 text-muted-foreground">Todas as vagas foram carregadas</div>
      )}
    </div>
  )
}
