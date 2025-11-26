"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Heart, Pause, X, CheckCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { CityDisplay } from "@/components/ui/city-display"
import { removeSavedJob } from "@/app/actions/saved-jobs"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface SavedJobCardProps {
  savedJob: any
  isRecruiter: boolean
}

export function SavedJobCard({ savedJob, isRecruiter }: SavedJobCardProps) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState(false)

  const handleRemove = async () => {
    if (!confirm("Deseja remover esta vaga dos salvos?")) return

    setIsRemoving(true)
    try {
      await removeSavedJob(savedJob.job_posts.id)
      router.refresh()
    } catch (error) {
      console.error("Erro ao remover vaga:", error)
      alert("Erro ao remover vaga. Tente novamente.")
    } finally {
      setIsRemoving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paused":
        return (
          <Badge variant="secondary" className="text-yellow-700 bg-yellow-100 text-xs">
            <Pause className="w-3 h-3 mr-1" />
            Pausada
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="secondary" className="text-red-700 bg-red-100 text-xs">
            <X className="w-3 h-3 mr-1" />
            Encerrada
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card
      className={`hover:shadow-md transition-shadow aspect-square md:aspect-square flex flex-col ${
        savedJob.job_posts.status !== "active" ? "opacity-75" : ""
      }`}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-sm md:text-base truncate">{savedJob.job_posts.title}</CardTitle>
              {getStatusBadge(savedJob.job_posts.status)}
            </div>
            <p className="text-blue-600 font-medium text-sm truncate">{savedJob.job_posts.company}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Heart className="w-3 h-3" />
            <span>{savedJob.job_posts.likes_count || 0}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              <CityDisplay cityId={savedJob.job_posts.city_id} fallback={savedJob.job_posts.location} />
            </span>
          </div>

          {savedJob.job_posts.salary && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Salário:</span>
              <span className="truncate">{savedJob.job_posts.salary}</span>
            </div>
          )}

          {savedJob.job_posts.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{savedJob.job_posts.description}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Salva em {new Date(savedJob.created_at).toLocaleDateString("pt-BR")}</span>
          </div>

          {!isRecruiter && savedJob.has_applied && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit">
              <CheckCircle className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                Candidatou-se
                {savedJob.application_date
                  ? ` em ${new Date(savedJob.application_date).toLocaleDateString("pt-BR")}`
                  : ""}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2 mt-auto">
          {savedJob.job_posts.status === "active" ? (
            <>
              <Button variant="outline" size="sm" asChild className="w-full bg-transparent text-xs">
                <Link href={`/post/${savedJob.job_posts.id}`}>Ver Vaga</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={isRemoving}
                className="w-full text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {isRemoving ? "Removendo..." : "Excluir"}
              </Button>
              {!isRecruiter && (
                <>
                  {!savedJob.has_applied ? (
                    <Button size="sm" asChild className="w-full text-xs">
                      <Link href={`/post/${savedJob.job_posts.id}`}>Candidatar-se</Link>
                    </Button>
                  ) : (
                    <Button size="sm" disabled className="w-full text-xs">
                      Já Candidatado
                    </Button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" disabled className="w-full bg-transparent text-xs">
                Ver Vaga
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemove}
                disabled={isRemoving}
                className="w-full text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {isRemoving ? "Removendo..." : "Excluir"}
              </Button>
              {!isRecruiter && (
                <Button size="sm" disabled className="w-full text-xs">
                  {savedJob.job_posts.status === "paused" ? "Vaga Pausada" : "Vaga Encerrada"}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
