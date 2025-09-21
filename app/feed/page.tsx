"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { JobFeed } from "@/components/job-feed"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import type { JobPostWithProfile } from "@/types/database"
import { preloadCities } from "@/hooks/use-cities"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import useMobile from "@/hooks/use-mobile"

export default function FeedPage() {
  const isMobile = useMobile()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const cityParam = searchParams.get("city") ? Number.parseInt(searchParams.get("city")!) : null
  const searchParam = searchParams.get("q") || ""
  const postParam = searchParams.get("post") || null

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [allPosts, setAllPosts] = useState<
    (JobPostWithProfile & {
      is_saved?: boolean
      has_applied?: boolean
      application_date?: string | null
      sector_ids?: number[]
    })[]
  >([])
  const [filteredPosts, setFilteredPosts] = useState<
    (JobPostWithProfile & {
      is_saved?: boolean
      has_applied?: boolean
      application_date?: string | null
      sector_ids?: number[]
    })[]
  >([])

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [salaryRanges, setSalaryRanges] = useState<string[]>([])
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  const [currentFilters, setCurrentFilters] = useState<{
    locations: number[]
    salaryRanges: string[]
    sectors: number[]
  }>({
    locations: [],
    salaryRanges: [],
    sectors: [],
  })

  const supabase = createClient()

  const fetchInitialData = useCallback(async () => {
    try {
      setIsInitialLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const loggedIn = !!user
      setIsLoggedIn(loggedIn)

      let profile = null
      if (loggedIn && user) {
        const { data: userProfileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        profile = userProfileData
        setUserProfile(profile)
      }

      const { data: fetchedPosts, error: postsError } = await supabase
        .from("job_posts")
        .select(
          `*, sector_ids, profiles (id, username, full_name, avatar_url, whatsapp, user_type, company_name, is_verified)`,
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (postsError) throw postsError

      let likedPostIds = new Set<string>()
      let savedPostIds = new Set<string>()
      const applicationData = new Map<string, { has_applied: boolean; application_date: string }>()

      if (loggedIn && user) {
        const [likesResult, savedResult, applicationsResult] = await Promise.all([
          supabase.from("post_likes").select("post_id").eq("user_id", user.id),
          supabase.from("saved_jobs").select("post_id").eq("user_id", user.id),
          supabase.from("job_applications").select("job_id, created_at").eq("user_id", user.id),
        ])

        likedPostIds = new Set(likesResult.data?.map((like) => like.post_id) || [])
        savedPostIds = new Set(savedResult.data?.map((saved) => saved.post_id) || [])
        applicationsResult.data?.forEach((app: any) => {
          if (app.job_id) {
            applicationData.set(app.job_id, { has_applied: true, application_date: app.created_at })
          }
        })
      }

      const postsWithEngagement =
        fetchedPosts?.map((post) => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
          is_saved: savedPostIds.has(post.id),
          has_applied: applicationData.get(post.id)?.has_applied || false,
          application_date: applicationData.get(post.id)?.application_date || null,
        })) || []

      setAllPosts(postsWithEngagement)
      const uniqueSalaries = Array.from(new Set(postsWithEngagement.filter((p) => p.salary).map((p) => p.salary!)))
      setSalaryRanges(uniqueSalaries)
      setHasLoadedOnce(true)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      setHasLoadedOnce(true)
    } finally {
      setIsInitialLoading(false)
    }
  }, [supabase])

  const applyFilters = useCallback(() => {
    const cityFromUrl = searchParams.get("city")
    const searchFromUrl = searchParams.get("q")
    const currentSelectedCityId = cityParam
    const currentSearchTerm = searchParam

    const filtered = allPosts.filter((post) => {
      if (postParam && post.id === postParam) return true

      const searchMatch =
        !currentSearchTerm ||
        post.title.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        post.company.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(currentSearchTerm.toLowerCase())

      const cityMatch = currentSelectedCityId === null || post.city_id === currentSelectedCityId

      const locationMatch =
        currentFilters.locations.length === 0 || currentFilters.locations.includes(post.city_id || 0)

      const salaryMatch =
        currentFilters.salaryRanges.length === 0 || (post.salary && currentFilters.salaryRanges.includes(post.salary))

      const sectorMatch =
        currentFilters.sectors.length === 0 ||
        (post.sector_ids && post.sector_ids.some((id: number) => currentFilters.sectors.includes(id)))

      return searchMatch && cityMatch && locationMatch && salaryMatch && sectorMatch
    })
    setFilteredPosts(filtered)
  }, [allPosts, cityParam, searchParam, currentFilters, postParam])

  useEffect(() => {
    preloadCities()
    fetchInitialData()
  }, [fetchInitialData])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  useEffect(() => {
    if (postParam && hasLoadedOnce && filteredPosts.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`post-${postParam}`)
        if (element) {
          setHighlightedPostId(postParam)
          element.scrollIntoView({ behavior: "smooth", block: "center" })
          setTimeout(() => setHighlightedPostId(null), 3000)
        }
      }, 500)
    }
  }, [postParam, hasLoadedOnce, filteredPosts])

  const handleMobileCityChange = (cityId: number | null) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (cityId) newParams.set("city", cityId.toString())
    else newParams.delete("city")
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  const handleMobileSearchChange = (search: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (search) newParams.set("q", search)
    else newParams.delete("q")
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  const handleMobileFilterChange = (filters: { locations: number[]; salaryRanges: string[]; sectors: number[] }) => {
    setCurrentFilters(filters)
  }

  return (
    <PageContainer
      header={
        isMobile ? (
          <PageHeader
            showSearch={true}
            showFilters={true}
            enableStickyBehavior={true}
            onSearchChange={handleMobileSearchChange}
            selectedCityId={searchParams.get("city") ? Number.parseInt(searchParams.get("city")!) : null}
            onCityChange={handleMobileCityChange}
            onFilterChange={handleMobileFilterChange}
            availableSalaryRanges={salaryRanges}
            userProfile={userProfile}
          />
        ) : null
      }
    >
      <JobFeed
        isLoggedIn={isLoggedIn}
        initialPosts={filteredPosts}
        userProfile={userProfile}
        isLoading={isInitialLoading}
        hasLoadedOnce={hasLoadedOnce}
        highlightedPostId={highlightedPostId}
        isDesktopLayout={!isMobile}
      />
    </PageContainer>
  )
}
