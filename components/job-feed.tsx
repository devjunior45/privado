"use client"
import { JobPost } from "@/components/job-post"
import type { JobPostWithProfile } from "@/types/database"
import { EnhancedJobSkeleton } from "@/components/ui/enhanced-job-skeleton"
import useMobile from "@/hooks/use-mobile"
import { useEffect, useState, useRef } from "react"
import { Loader2 } from "lucide-react"

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
  const prefetchSentinelRef = useRef<HTMLDivElement>(null)
  const [isPrefetching, setIsPrefetching] = useState(false)

  const posts = initialPosts.slice(0, displayedCount)
  const hasMore = displayedCount < initialPosts.length

  const loadMore = () => {
    if (isLoadingMore || !hasMore || isPrefetching) return

    setIsLoadingMore(true)

    if (containerRef.current) {
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
    }

    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + 10, initialPosts.length))
      setIsLoadingMore(false)
      setIsPrefetching(false)

      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
    }, 800)
  }

  useEffect(() => {
    setDisplayedCount(10)
  }, [initialPosts.length])

  useEffect(() => {
    if (!prefetchSentinelRef.current || !hasMore) return

    const prefetchObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isPrefetching) {
          setIsPrefetching(true)
        }
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    prefetchObserver.observe(prefetchSentinelRef.current)

    return () => {
      prefetchObserver.disconnect()
    }
  }, [hasMore, isLoadingMore, isPrefetching, displayedCount])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && isPrefetching) {
          loadMore()
        }
      },
      { threshold: 0.1 },
    )

    observerRef.current.observe(sentinelRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, displayedCount, isPrefetching])

  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
      document.documentElement.style.overflow = ""
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

  const prefetchIndex = Math.floor(posts.length * 0.7)

  return (
    <div ref={containerRef} className={isMobile ? "space-y-0.5 bg-muted/20" : "space-y-4"}>
      {posts.map((post, index) => (
        <div key={post.id}>
          <JobPost
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
          {index === prefetchIndex && hasMore && <div ref={prefetchSentinelRef} className="h-1" />}
        </div>
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="py-8">
          {(isLoadingMore || isPrefetching) && (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando mais vagas...</p>
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
