"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  DollarSign,
  Send,
  Bookmark,
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import type { JobPostWithProfile } from "@/types/database"
import { toggleLike } from "@/app/actions/posts"
import { toggleSaveJob } from "@/app/actions/saved-jobs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { applyToJobPlatform } from "@/app/actions/profile"
import { trackJobView } from "@/app/actions/dashboard"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CommentsSheet } from "@/components/comments/comments-sheet"
import { CityDisplay } from "@/components/ui/city-display"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import useMobile from "@/hooks/use-mobile"

interface JobPostProps {
  jobPost: JobPostWithProfile & {
    is_saved?: boolean
    has_applied?: boolean
    application_date?: string | null
    allow_platform_applications?: boolean
    profiles: {
      id: string
      username: string
      full_name: string | null
      avatar_url: string | null
      whatsapp: string | null
      user_type: string
      company_name: string | null
      is_verified?: boolean
    }
  }
  profile?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
    whatsapp: string | null
    user_type: string
    company_name: string | null
    is_verified?: boolean
  }
  userProfile?: {
    id: string
    username: string
    full_name?: string | null
    user_type?: string
    whatsapp?: string | null
    experiences?: any[]
    education?: any[]
    skills?: string[]
    professional_summary?: string | null
  }
  isLoggedIn: boolean
  isLikedInitially?: boolean
  isSavedInitially?: boolean
  hasAppliedInitially?: boolean
  applicationDate?: string | null
  className?: string
  style?: React.CSSProperties
  id?: string
}

export function JobPostComponent({
  jobPost,
  profile,
  userProfile,
  isLoggedIn,
  isLikedInitially,
  isSavedInitially,
  hasAppliedInitially,
  applicationDate: initialApplicationDate,
  className,
  style,
  id,
}: JobPostProps) {
  const isMobile = useMobile()
  const [isLiked, setIsLiked] = useState(isLikedInitially || jobPost?.is_liked || false)
  const [isSaved, setIsSaved] = useState(isSavedInitially || jobPost?.is_saved || false)
  const [hasApplied, setHasApplied] = useState(hasAppliedInitially || jobPost?.has_applied || false)
  const [applicationDate, setApplicationDate] = useState(initialApplicationDate || jobPost?.application_date)
  const [likesCount, setLikesCount] = useState(jobPost?.likes_count || 0)
  const [isPending, startTransition] = useTransition()
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [showFullInfo, setShowFullInfo] = useState(false)
  const [hasTrackedView, setHasTrackedView] = useState(false)
  const router = useRouter()

  const [jobPostId, setJobPostId] = useState<string | undefined>(undefined)
  const [jobPostTitle, setJobPostTitle] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (jobPost?.id) {
      setJobPostId(jobPost.id)
    }
    if (jobPost?.title) {
      setJobPostTitle(jobPost.title)
    }
  }, [jobPost?.id, jobPost?.title])

  const postProfile = profile || jobPost.profiles

  useEffect(() => {
    if (jobPostId && jobPostTitle) {
      console.log("🔍 JobPost Debug:", {
        postId: jobPostId,
        title: jobPostTitle,
        hasApplied: hasApplied,
        applicationDate: applicationDate,
        postHasApplied: jobPost.has_applied,
        postApplicationDate: jobPost.application_date,
      })
    }
  }, [jobPostId, jobPostTitle, hasApplied, applicationDate, jobPost?.has_applied, jobPost?.application_date])

  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    triggerOnce: true,
  })

  useEffect(() => {
    if (isIntersecting && !hasTrackedView && jobPost?.id) {
      trackJobView(jobPost.id, userProfile?.id)
      setHasTrackedView(true)
    }
  }, [isIntersecting, hasTrackedView, jobPost?.id, userProfile?.id])

  useEffect(() => {
    if (jobPost?.id) {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get("comments") === jobPost.id) {
        setIsCommentsOpen(true)
      }
    }
  }, [jobPost?.id])

  const validateProfile = () => {
    const missingFields = []
    if (!userProfile?.whatsapp) missingFields.push("WhatsApp")
    if (!userProfile?.experiences || userProfile.experiences.length === 0)
      missingFields.push("Experiências profissionais")
    if (!userProfile?.education || userProfile.education.length === 0) missingFields.push("Escolaridade")
    if (!userProfile?.skills || userProfile.skills.length === 0) missingFields.push("Habilidades")
    if (!userProfile?.professional_summary) missingFields.push("Resumo profissional")
    return missingFields
  }

  const handleLike = () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    setIsLiked(!isLiked)
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1))
    startTransition(async () => {
      try {
        await toggleLike(jobPost.id)
      } catch (error) {
        setIsLiked(isLiked)
        setLikesCount(jobPost.likes_count)
        console.error("Erro ao curtir post:", error)
      }
    })
  }

  const handleSave = () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    const wasSaving = !isSaved
    setIsSaved(!isSaved)
    startTransition(async () => {
      try {
        const result = await toggleSaveJob(jobPost.id)
        if (result.wasSaved) {
          setTimeout(() => {
            router.push("/saved")
          }, 800)
        }
      } catch (error) {
        setIsSaved(isSaved)
        console.error("Erro ao salvar post:", error)
        alert("Erro ao salvar vaga. Tente novamente.")
      }
    })
  }

  const handleApply = async () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    const missingFields = validateProfile()
    if (!userProfile?.whatsapp) {
      alert("É necessário preencher o número do WhatsApp no seu perfil antes de se candidatar.")
      router.push("/profile")
      return
    }
    setIsApplying(true)
    try {
      await applyToJobPlatform(jobPost.id)
      alert("Candidatura enviada com sucesso! Seu currículo foi enviado para o recrutador.")
      setHasApplied(true)
      setApplicationDate(new Date().toISOString())
      setIsApplyOpen(false)
    } catch (error) {
      console.error("❌ Erro ao se candidatar:", error)
      alert("Erro ao se candidatar. Tente novamente.")
    } finally {
      setIsApplying(false)
    }
  }

  const handleShare = async () => {
    const jobUrl = `${window.location.origin}/post/${jobPost.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${jobPost.title} - ${jobPost.company}`,
          text: jobPost.description,
          url: jobUrl,
        })
      } catch (error) {
        console.log("Erro ao compartilhar:", error)
        navigator.clipboard.writeText(jobUrl)
        alert("Link da vaga copiado!")
      }
    } else {
      navigator.clipboard.writeText(jobUrl)
      alert("Link da vaga copiado!")
    }
  }

  const handleComments = () => setIsCommentsOpen(true)
  const handleCloseComments = () => setIsCommentsOpen(false)

  const isCandidate = userProfile?.user_type === "candidate"
  const isOwnPost = userProfile?.id === jobPost.author_id
  const allowsPlatformApplications = jobPost.allow_platform_applications

  const missingFields = isLoggedIn && isCandidate ? validateProfile() : []
  const hasProfileIssues = missingFields.length > 0

  return (
    <>
      <Card
        className={`w-full ${isMobile ? "rounded-none shadow-none border-0" : "max-w-md mx-auto mb-6 border"} ${className || ""}`}
        ref={targetRef}
        id={id || `post-${jobPost.id}`}
        style={style}
      >
        <CardHeader className={`flex flex-row items-center gap-3 pb-3 ${isMobile ? "px-1 pt-3 bg-white" : ""}`}>
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={postProfile.avatar_url || "/placeholder.svg"} alt={postProfile.full_name || ""} />
              <AvatarFallback>
                {postProfile.company_name
                  ? postProfile.company_name.charAt(0).toUpperCase()
                  : (postProfile.full_name || postProfile.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {postProfile.is_verified && (
              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${postProfile.username}`} className="hover:underline">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">
                  {postProfile.company_name || postProfile.full_name || postProfile.username}
                </p>
                {postProfile.is_verified && (
                  <Badge className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                    <ShieldCheck className="w-2 h-2 mr-1" />
                    Verificada
                  </Badge>
                )}
              </div>
            </Link>
            <p className="text-xs text-muted-foreground truncate">@{postProfile.username}</p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {jobPost.image_url ? (
            <div className="relative w-full overflow-hidden">
              <Image
                src={jobPost.image_url || "/placeholder.svg"}
                alt={jobPost.title}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto max-w-full"
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : (
            <div
              className={`w-full flex flex-col items-center justify-center text-white p-6 ${
                isMobile ? "min-h-[200px]" : "aspect-square"
              }`}
              style={{ backgroundColor: jobPost.background_color }}
            >
              <h3 className="text-xl font-bold text-center mb-4">{jobPost.title}</h3>
              <div className="flex items-center gap-1 text-lg">
                <MapPin className="w-5 h-5" />
                <CityDisplay cityId={jobPost.city_id} fallback={jobPost.location} />
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className={`flex flex-col gap-3 pt-3 ${isMobile ? "px-1 pb-3 bg-white" : ""}`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={handleLike} className="p-0 h-auto">
                  <Heart className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <span className="text-sm text-muted-foreground">{likesCount}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleComments} className="p-0 h-auto">
                <MessageCircle className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare} className="p-0 h-auto">
                <Share2 className="w-6 h-6" />
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={handleSave} className="p-0 h-auto">
                <Bookmark className={`w-6 h-6 ${isSaved ? "fill-blue-500 text-blue-500" : ""}`} />
              </Button>
              {(!isLoggedIn || (isLoggedIn && isCandidate)) && !isOwnPost && allowsPlatformApplications && (
                <>
                  {hasApplied ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full flex-shrink-0">
                      <CheckCircle className="w-4 h-4" />
                      <span className="whitespace-nowrap">
                        Candidatou-se
                        {applicationDate ? ` em ${new Date(applicationDate).toLocaleDateString("pt-BR")}` : ""}
                      </span>
                    </div>
                  ) : (
                    <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex-shrink-0">
                          <Send className="w-4 h-4 mr-2" />
                          Candidatar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Candidatar-se à vaga</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <h3 className="font-semibold">{jobPost.title}</h3>
                            <p className="text-sm text-muted-foreground">{jobPost.company}</p>
                          </div>
                          {hasProfileIssues && (
                            <Alert className="border-yellow-200 bg-yellow-50">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-sm text-yellow-800">
                                <p className="font-medium mb-2">Algumas seções do seu perfil não estão preenchidas:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {missingFields.map((field, index) => (
                                    <li key={index}>{field}</li>
                                  ))}
                                </ul>
                                <p className="mt-2">Deseja realmente enviar a candidatura?</p>
                              </AlertDescription>
                            </Alert>
                          )}
                          <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Seu currículo será gerado automaticamente com base no seu perfil e enviado para o
                              recrutador.
                            </AlertDescription>
                          </Alert>
                          <Button onClick={handleApply} disabled={isApplying} className="w-full">
                            {isApplying ? "Enviando..." : "Confirmar Candidatura"}
                          </Button>
                          {hasProfileIssues && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsApplyOpen(false)
                                router.push("/profile")
                              }}
                              className="w-full"
                            >
                              Completar Perfil Primeiro
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="w-full text-left min-w-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base truncate flex-1">{jobPost.title}</h3>
                {!showFullInfo && (
                  <button
                    onClick={() => setShowFullInfo(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                  >
                    ...ver mais
                  </button>
                )}
              </div>

              {showFullInfo && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground break-words">{jobPost.description}</p>
                  <p className="font-semibold text-blue-600 truncate">{jobPost.company}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1 min-w-0">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        <CityDisplay cityId={jobPost.city_id} fallback={jobPost.location} />
                      </span>
                    </div>
                    {jobPost.salary && (
                      <div className="flex items-center gap-1 min-w-0">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{jobPost.salary}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(jobPost.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
      {jobPost?.id && jobPost?.title && (
        <CommentsSheet
          isOpen={isCommentsOpen}
          onClose={handleCloseComments}
          postId={jobPost.id}
          postTitle={jobPost.title}
        />
      )}
    </>
  )
}

export default JobPostComponent
export { JobPostComponent as JobPost }
