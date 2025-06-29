"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { getApplicationsWithCandidates } from "@/app/actions/dashboard"
import { CityDisplay } from "@/components/ui/city-display"
import { ArrowLeft, Phone, FileText, Search, Download, MapPin, Calendar, Briefcase } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface JobCandidatesPageProps {
  jobId: string
  jobTitle: string
  jobCompany: string
}

export function JobCandidatesPage({ jobId, jobTitle, jobCompany }: JobCandidatesPageProps) {
  const [applications, setApplications] = useState<any[]>([])
  const [filteredApplications, setFilteredApplications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const applicationsData = await getApplicationsWithCandidates(jobId)
        setApplications(applicationsData)
        setFilteredApplications(applicationsData)
      } catch (error) {
        console.error("Erro ao buscar candidatos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os candidatos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [jobId, toast])

  // Filtrar candidatos por nome, habilidades e experiência
  useEffect(() => {
    let filtered = applications

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((app) => {
        const profile = app.profiles

        // Buscar no nome
        const nameMatch =
          profile?.full_name?.toLowerCase().includes(searchLower) ||
          profile?.username?.toLowerCase().includes(searchLower)

        // Buscar nas habilidades
        const skillsMatch = profile?.skills?.some((skill: string) => skill.toLowerCase().includes(searchLower))

        // Buscar nas experiências
        const experienceMatch = profile?.experiences?.some(
          (exp: any) =>
            exp.position?.toLowerCase().includes(searchLower) ||
            exp.company?.toLowerCase().includes(searchLower) ||
            exp.activities?.toLowerCase().includes(searchLower),
        )

        return nameMatch || skillsMatch || experienceMatch
      })
    }

    setFilteredApplications(filtered)
  }, [applications, searchTerm])

  const exportAllResumes = () => {
    const resumeUrls = applications.filter((app) => app.resume_pdf_url).map((app) => app.resume_pdf_url)

    if (resumeUrls.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum currículo disponível para download",
        variant: "destructive",
      })
      return
    }

    resumeUrls.forEach((url) => {
      window.open(url, "_blank")
    })

    toast({
      title: "Sucesso",
      description: `${resumeUrls.length} currículos foram abertos para download`,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-12" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="sm" asChild className="p-2">
              <Link href="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{jobTitle}</h1>
              <p className="text-sm text-muted-foreground truncate">{jobCompany}</p>
            </div>
            {applications.length > 0 && (
              <Button onClick={exportAllResumes} size="sm" variant="outline" className="text-xs">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">CVs</span>
              </Button>
            )}
          </div>

          {/* Barra de Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome, habilidades ou experiência..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Contador */}
          <div className="text-xs text-muted-foreground mt-2">
            {filteredApplications.length} de {applications.length} candidato(s)
          </div>
        </div>
      </div>

      {/* Lista de Candidatos */}
      <div className="p-4 space-y-3">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                {applications.length === 0 ? "Ainda não há candidatos para esta vaga." : "Nenhum candidato encontrado."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => {
            const profile = application.profiles
            const latestExperience = profile?.experiences?.[0]

            return (
              <Card key={application.id} className="shadow-sm">
                <CardContent className="p-4">
                  {/* Header do Card */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-sm">
                        {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">
                        {profile?.full_name || profile?.username || "Nome não informado"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>@{profile?.username}</span>
                        {application.application_type === "external" && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            Externa
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informações Principais */}
                  <div className="space-y-2 mb-3">
                    {/* Localização e Data */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {profile?.city_id && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <CityDisplay cityId={profile.city_id} fallback={profile?.city} />
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(application.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>

                    {/* Experiência Atual */}
                    {latestExperience && (
                      <div className="flex items-start gap-1 text-xs">
                        <Briefcase className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium">{latestExperience.position}</span>
                          {latestExperience.company && (
                            <span className="text-muted-foreground"> • {latestExperience.company}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Habilidades */}
                  {profile?.skills && profile.skills.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 6).map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 6 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            +{profile.skills.length - 6}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2">
                    {application.resume_pdf_url && (
                      <Button variant="outline" size="sm" className="flex-1 h-9" asChild>
                        <a href={application.resume_pdf_url} target="_blank" rel="noreferrer">
                          <FileText className="w-4 h-4 mr-1" />
                          <span className="text-xs">Currículo</span>
                        </a>
                      </Button>
                    )}

                    {profile?.whatsapp && (
                      <Button size="sm" className="flex-1 h-9" asChild>
                        <a
                          href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          <span className="text-xs">WhatsApp</span>
                        </a>
                      </Button>
                    )}

                    <Button variant="ghost" size="sm" className="px-3 h-9" asChild>
                      <Link href={`/profile/${profile?.username}`}>
                        <span className="text-xs">Ver Perfil</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
