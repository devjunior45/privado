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
import { ArrowLeft, Phone, FileText, Search, Download, MapPin, Briefcase } from "lucide-react"
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
      const link = document.createElement("a")
      link.href = url
      link.download = ""
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })

    toast({
      title: "Sucesso",
      description: `${resumeUrls.length} currículos foram baixados`,
    })
  }

  const downloadResume = (resumeUrl: string, candidateName: string) => {
    const link = document.createElement("a")
    link.href = resumeUrl
    link.download = `curriculo-${candidateName.replace(/\s+/g, "-").toLowerCase()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="space-y-4 p-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-12" />
          <div className="space-y-3 mx-4 md:mx-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header Fixo */}
      <div className="sticky top-0 z-10 bg-white dark:bg-black border-b shadow-sm dark:border-gray-800">
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
              <Button onClick={exportAllResumes} size="sm" variant="outline" className="text-xs bg-transparent">
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
        <div className="mx-4 md:mx-0">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  {applications.length === 0
                    ? "Ainda não há candidatos para esta vaga."
                    : "Nenhum candidato encontrado."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredApplications.map((application) => {
                const profile = application.profiles
                const latestExperience = profile?.experiences?.[0]

                return (
                  <Card key={application.id} className="shadow-sm aspect-square flex flex-col">
                    <CardContent className="p-4 flex flex-col h-full">
                      {/* Header do Card */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs truncate">
                            {profile?.full_name || profile?.username || "Nome não informado"}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="truncate">@{profile?.username}</span>
                            {application.application_type === "external" && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                Ext
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Informações Principais */}
                      <div className="space-y-1 mb-2 flex-1">
                        {/* Localização e Data */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {profile?.city_id && (
                            <div className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <CityDisplay cityId={profile.city_id} fallback={profile?.city} />
                            </div>
                          )}
                        </div>

                        {/* Experiência Atual */}
                        {latestExperience && (
                          <div className="flex items-start gap-1 text-xs">
                            <Briefcase className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium truncate block">{latestExperience.position}</span>
                              {latestExperience.company && (
                                <span className="text-muted-foreground truncate block">{latestExperience.company}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Habilidades */}
                      {profile?.skills && profile.skills.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {profile.skills.slice(0, 3).map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs px-1 py-0.5">
                                {skill}
                              </Badge>
                            ))}
                            {profile.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1 py-0.5">
                                +{profile.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex gap-1 mt-auto">
                        {application.resume_pdf_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs bg-transparent"
                            onClick={() =>
                              downloadResume(
                                application.resume_pdf_url,
                                profile?.full_name || profile?.username || "candidato",
                              )
                            }
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                        )}

                        {profile?.whatsapp && (
                          <Button size="sm" className="flex-1 h-8 text-xs" asChild>
                            <a
                              href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </Button>
                        )}

                        <Button variant="ghost" size="sm" className="px-2 h-8 text-xs" asChild>
                          <Link href={`/profile/${profile?.username}`}>Ver</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
