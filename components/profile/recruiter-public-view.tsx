"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Building2, Users, Eye, Heart, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getRecruiterJobs } from "@/app/actions/dashboard"
import { CityDisplay } from "@/components/ui/city-display"

interface Job {
  id: string
  title: string
  company: string
  location: string
  city_id: number | null
  status: "active" | "paused" | "closed"
  created_at: string
  views_count: number
  likes_count: number
  applications_count: number
  platform_applications_count: number
  external_applications_count: number
}

interface RecruiterPublicViewProps {
  profile: {
    id: string
    full_name: string
    company: string
    bio: string
    avatar_url: string
    is_verified: boolean
    created_at: string
  }
  isOwnProfile: boolean
}

export function RecruiterPublicView({ profile, isOwnProfile }: RecruiterPublicViewProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true)
        const jobsData = await getRecruiterJobs(profile.id)

        // Filtrar vagas baseado no contexto:
        // - Para o próprio recrutador: mostrar ativas e pausadas (não encerradas)
        // - Para outros usuários: mostrar apenas ativas
        const filteredJobs = jobsData.filter((job) => {
          if (job.status === "closed") {
            return false // Nunca mostrar vagas encerradas no perfil
          }

          if (isOwnProfile) {
            return job.status === "active" || job.status === "paused"
          } else {
            return job.status === "active"
          }
        })

        setJobs(filteredJobs)
      } catch (error) {
        console.error("Erro ao carregar vagas:", error)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [profile.id, isOwnProfile])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300">
            Ativa
          </Badge>
        )
      case "paused":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300">
            Pausada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Informações do Perfil */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                {profile.is_verified && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    ✓ Verificado
                  </Badge>
                )}
              </div>

              {profile.company && (
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Building2 className="w-4 h-4" />
                  <span>{profile.company}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Calendar className="w-4 h-4" />
                <span>Membro desde {new Date(profile.created_at).toLocaleDateString("pt-BR")}</span>
              </div>

              {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vagas Publicadas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Vagas Publicadas ({jobs.length})</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="flex gap-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {isOwnProfile ? "Você ainda não publicou nenhuma vaga." : "Este recrutador ainda não publicou vagas."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="h-full">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    {getStatusBadge(job.status)}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/feed?post=${job.id}`} target="_blank">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{job.title}</h3>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium truncate">{job.company}</p>
                      <CityDisplay cityId={job.city_id} fallback={job.location} className="text-xs" />
                      <p>Publicada em {new Date(job.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {job.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {job.applications_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {job.likes_count || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
