"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Building,
  Calendar,
  Heart,
  MessageCircle,
  ArrowLeft,
  Phone,
  Mail,
  Pause,
  X,
  Share,
  Shield,
} from "lucide-react"
import type { UserProfile } from "@/types/profile"
import type { JobPostWithProfile } from "@/types/database"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CityDisplay } from "@/components/ui/city-display"
import { RecruiterProfileClient } from "@/components/profile/recruiter-profile-client"

interface RecruiterPublicViewProps {
  profile: UserProfile
  jobPosts: JobPostWithProfile[]
  isLoggedIn: boolean
  isOwnProfile?: boolean
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paused":
      return (
        <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
          <Pause className="w-3 h-3 mr-1" />
          Pausada
        </Badge>
      )
    case "closed":
      return (
        <Badge variant="secondary" className="text-red-700 bg-red-100">
          <X className="w-3 h-3 mr-1" />
          Encerrada
        </Badge>
      )
    default:
      return null
  }
}

export function RecruiterPublicView({ profile, jobPosts, isLoggedIn, isOwnProfile = false }: RecruiterPublicViewProps) {
  const [selectedView, setSelectedView] = useState<"grid" | "list">("grid")
  const router = useRouter()

  const handleWhatsAppContact = () => {
    if (profile.whatsapp) {
      const message = `Olá ${profile.company_name || profile.full_name || profile.username}, vi suas vagas na Nortão Empregos!`
      const whatsappUrl = `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    }
  }

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profile.username}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.company_name || profile.full_name} - Nortão Empregos`,
          text: `Confira o perfil de ${profile.company_name || profile.full_name} na Nortão Empregos`,
          url: profileUrl,
        })
      } catch (error) {
        // Fallback para clipboard se o share nativo falhar
        await navigator.clipboard.writeText(profileUrl)
        // Aqui você pode adicionar um toast de sucesso
      }
    } else {
      // Fallback para clipboard
      await navigator.clipboard.writeText(profileUrl)
      // Aqui você pode adicionar um toast de sucesso
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
  }

  // Filtrar vagas encerradas se não for o próprio perfil
  const visibleJobPosts = isOwnProfile
    ? jobPosts.filter((post) => post.status !== "closed")
    : jobPosts.filter((post) => post.status === "active")

  return (
    <div className="min-h-screen dark:bg-black bg-white">
      {/* Header fixo */}
      <div className="bg-white dark:bg-black border-b sticky top-0 z-40 shadow-sm md:hidden">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          {isOwnProfile ? (
            <h1 className="font-semibold text-lg flex-1 text-center">Perfil</h1>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="font-semibold text-lg truncate">@{profile.username}</h1>
            </>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Seção do Perfil */}
        <div className="bg-white dark:bg-black dark:text-white p-6 space-y-4">
          {/* Avatar e Info Principal */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.company_name || ""} />
              <AvatarFallback className="text-2xl">
                {(profile.company_name || profile.full_name || profile.username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{profile.company_name || profile.full_name || profile.username}</h2>
                  {profile.is_verified && (
                    <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                      <Shield className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>
                {profile.company_name && profile.full_name && (
                  <p className="text-sm text-muted-foreground">Responsável: {profile.full_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Localização */}
          {profile.city_id && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <CityDisplay cityId={profile.city_id} fallback={profile.company_location} />
            </div>
          )}

          {/* Descrição */}
          {profile.professional_summary && (
            <div>
              <p className="text-sm">{profile.professional_summary}</p>
            </div>
          )}

          {/* Botões de Ação */}
          {isOwnProfile ? (
            <div className="space-y-2">
              {/* Botões principais */}
              <div className="flex gap-2">
                <RecruiterProfileClient profile={profile} />
                <Button variant="outline" onClick={handleShareProfile} className="flex-1 bg-transparent" size="sm">
                  <Share className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Botão de verificação se não estiver verificado */}
              {!profile.is_verified && <RecruiterProfileClient profile={profile} showVerificationButton={true} />}
            </div>
          ) : (
            <div className="flex gap-2">
              {profile.whatsapp && (
                <Button onClick={handleWhatsAppContact} className="flex-1" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Contatar
                </Button>
              )}
              {profile.email && (
                <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Header das Vagas */}
        <div className="bg-white dark:bg-black px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Building className="w-4 h-4" />
              Vagas Publicadas
            </h3>
            <div className="flex gap-1">
              <Button
                variant={selectedView === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedView("grid")}
                className="h-8 w-8 p-0"
              >
                <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                  <div className="bg-current rounded-[1px]" />
                  <div className="bg-current rounded-[1px]" />
                  <div className="bg-current rounded-[1px]" />
                  <div className="bg-current rounded-[1px]" />
                </div>
              </Button>
              <Button
                variant={selectedView === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedView("list")}
                className="h-8 w-8 p-0"
              >
                <div className="space-y-0.5 w-3 h-3">
                  <div className="bg-current h-0.5 rounded-[1px]" />
                  <div className="bg-current h-0.5 rounded-[1px]" />
                  <div className="bg-current h-0.5 rounded-[1px]" />
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Grid/Lista de Vagas */}
        <div className="bg-white dark:bg-black">
          {visibleJobPosts.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {isOwnProfile ? "Nenhuma vaga publicada ainda" : "Nenhuma vaga ativa no momento"}
              </p>
            </div>
          ) : selectedView === "grid" ? (
            /* Vista em Grid (estilo Instagram) */
            <div className="grid grid-cols-3 gap-1 p-1">
              {visibleJobPosts.map((post) => (
                <div key={post.id} className="aspect-square relative group">
                  {post.status === "active" || isOwnProfile ? (
                    <Link href={`/post/${post.id}`} className="block w-full h-full">
                      {post.image_url ? (
                        <Image
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover rounded-sm"
                          sizes="(max-width: 768px) 33vw"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center text-white p-2 rounded-sm"
                          style={{ backgroundColor: post.background_color }}
                        >
                          <p className="text-xs font-bold text-center leading-tight">{post.title}</p>
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div className="w-full h-full relative opacity-75">
                      {post.image_url ? (
                        <Image
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover rounded-sm"
                          sizes="(max-width: 768px) 33vw"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center text-white p-2 rounded-sm"
                          style={{ backgroundColor: post.background_color }}
                        >
                          <p className="text-xs font-bold text-center leading-tight">{post.title}</p>
                        </div>
                      )}
                      {/* Status overlay */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-sm">
                        {getStatusBadge(post.status)}
                      </div>
                    </div>
                  )}

                  {/* Overlay com estatísticas (apenas para vagas ativas) */}
                  {post.status === "active" && (
                    <Link
                      href={`/post/${post.id}`}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm"
                    >
                      <div className="flex items-center gap-3 text-white text-sm">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>0</span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Vista em Lista */
            <div className="divide-y">
              {visibleJobPosts.map((post) => (
                <div
                  key={post.id}
                  className={`p-4 ${post.status !== "active" ? "opacity-75" : "hover:bg-gray-50 dark:hover:bg-gray-800"} transition-colors`}
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 flex-shrink-0 relative">
                      {post.image_url ? (
                        <Image
                          src={post.image_url || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover rounded-md"
                          sizes="64px"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white rounded-md"
                          style={{ backgroundColor: post.background_color }}
                        >
                          <Building className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">{post.title}</h4>
                        {isOwnProfile && getStatusBadge(post.status)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{post.company}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <CityDisplay cityId={post.city_id} fallback={post.location} />
                        </div>
                        {post.salary && (
                          <Badge variant="secondary" className="text-xs">
                            {post.salary}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{post.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                        {post.status === "active" ? (
                          <Link href={`/post/${post.id}`}>
                            <Button size="sm" variant="outline">
                              Ver Vaga
                            </Button>
                          </Link>
                        ) : isOwnProfile ? (
                          <Button size="sm" disabled>
                            {post.status === "paused" ? "Pausada" : "Encerrada"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Espaçamento para navegação */}
      <div className="h-20" />
    </div>
  )
}
