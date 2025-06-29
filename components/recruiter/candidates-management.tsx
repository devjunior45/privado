"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApplicationsWithCandidates, updateApplicationStatus, getJobsWithStats } from "@/app/actions/dashboard"
import { CityDisplay } from "@/components/ui/city-display"
import type { ApplicationWithCandidate, ApplicationFilters, JobWithStats } from "@/types/dashboard"
import { Download, MessageSquare, Calendar, MapPin, GraduationCap, FileText, Filter, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface CandidatesManagementProps {
  recruiterId: string
  initialJobId?: string
}

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  reviewing: { label: "Analisando", color: "bg-blue-100 text-blue-800" },
  shortlisted: { label: "Pré-selecionado", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
  hired: { label: "Contratado", color: "bg-purple-100 text-purple-800" },
}

export function CandidatesManagement({ recruiterId, initialJobId }: CandidatesManagementProps) {
  const [applications, setApplications] = useState<ApplicationWithCandidate[]>([])
  const [jobs, setJobs] = useState<JobWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ApplicationFilters>({
    jobId: initialJobId,
  })
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithCandidate | null>(null)
  const [statusNotes, setStatusNotes] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const [applicationsData, jobsData] = await Promise.all([
          getApplicationsWithCandidates(recruiterId, filters),
          getJobsWithStats(recruiterId),
        ])

        setApplications(applicationsData)
        setJobs(jobsData)
      } catch (error) {
        console.error("Erro ao buscar candidaturas:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as candidaturas",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [recruiterId, filters, toast])

  const handleStatusUpdate = async (applicationId: string, newStatus: string, notes?: string) => {
    try {
      await updateApplicationStatus(applicationId, newStatus, notes)

      setApplications(
        applications.map((app) =>
          app.id === applicationId
            ? { ...app, status: newStatus as any, recruiter_notes: notes || app.recruiter_notes }
            : app,
        ),
      )

      toast({
        title: "Sucesso",
        description: "Status da candidatura atualizado com sucesso",
      })

      setSelectedApplication(null)
      setStatusNotes("")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      })
    }
  }

  const handleFilterChange = (key: keyof ApplicationFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={filters.jobId || ""} onValueChange={(value) => handleFilterChange("jobId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as vagas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as vagas</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status || ""} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.applicationType || ""}
              onValueChange={(value) => handleFilterChange("applicationType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="platform">Pela Plataforma</SelectItem>
                <SelectItem value="external">Externa (WhatsApp)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Candidaturas */}
      <div className="space-y-4">
        {applications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Nenhuma candidatura encontrada com os filtros aplicados.</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((application) => (
            <Card key={application.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 flex-1">
                    <Avatar>
                      <AvatarImage
                        src={application.profiles.avatar_url || "/placeholder.svg"}
                        alt={application.profiles.full_name || ""}
                      />
                      <AvatarFallback>
                        {(application.profiles.full_name || application.profiles.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/profile/${application.profiles.username}`}
                          className="font-semibold hover:underline"
                        >
                          {application.profiles.full_name || application.profiles.username}
                        </Link>
                        <Badge className={statusConfig[application.status].color}>
                          {statusConfig[application.status].label}
                        </Badge>
                        <Badge variant="outline">
                          {application.application_type === "platform" ? (
                            <>
                              <FileText className="w-3 h-3 mr-1" />
                              Plataforma
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-3 h-3 mr-1" />
                              WhatsApp
                            </>
                          )}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="font-medium">{application.job_posts.title}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(application.created_at).toLocaleDateString("pt-BR")}
                          </div>
                          {application.profiles.city_id && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <CityDisplay cityId={application.profiles.city_id} />
                            </div>
                          )}
                          {application.profiles.education && (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {application.profiles.education}
                            </div>
                          )}
                        </div>
                      </div>

                      {application.profiles.professional_summary && (
                        <p className="text-sm mt-2 text-gray-600 line-clamp-2">
                          {application.profiles.professional_summary}
                        </p>
                      )}

                      {application.profiles.skills && application.profiles.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {application.profiles.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {application.profiles.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{application.profiles.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {application.message && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm">{application.message}</p>
                        </div>
                      )}

                      {application.recruiter_notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Suas anotações:</p>
                          <p className="text-sm text-blue-700">{application.recruiter_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Ações rápidas de status */}
                    <div className="flex gap-1">
                      {application.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(application.id, "reviewing")}
                        >
                          Analisar
                        </Button>
                      )}
                      {(application.status === "pending" || application.status === "reviewing") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleStatusUpdate(application.id, "shortlisted")}
                        >
                          Pré-selecionar
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/profile/${application.profiles.username}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Perfil
                        </Link>
                      </Button>

                      {application.resume_pdf_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.resume_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            CV
                          </a>
                        </Button>
                      )}

                      {application.profiles.whatsapp && (
                        <Button size="sm" asChild>
                          <a
                            href={`https://wa.me/${application.profiles.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            WhatsApp
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Dialog para mudança de status com anotações */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application)
                            setStatusNotes(application.recruiter_notes || "")
                          }}
                        >
                          Alterar Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Alterar Status - {application.profiles.full_name || application.profiles.username}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Novo Status</label>
                            <Select
                              defaultValue={application.status}
                              onValueChange={(value) => {
                                if (selectedApplication) {
                                  setSelectedApplication({
                                    ...selectedApplication,
                                    status: value as any,
                                  })
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key || "default"}>
                                    {config.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-medium">Anotações (opcional)</label>
                            <Textarea
                              value={statusNotes}
                              onChange={(e) => setStatusNotes(e.target.value)}
                              placeholder="Adicione suas anotações sobre este candidato..."
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                              Cancelar
                            </Button>
                            <Button
                              onClick={() => {
                                if (selectedApplication) {
                                  handleStatusUpdate(selectedApplication.id, selectedApplication.status, statusNotes)
                                }
                              }}
                            >
                              Salvar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
