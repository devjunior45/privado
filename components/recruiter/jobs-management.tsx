"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, MoreVertical, Eye, Users, Play, Pause, X, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getRecruiterJobs, updateJobStatus } from "@/app/actions/dashboard"
import { CityDisplay } from "@/components/ui/city-display"
import { toast } from "sonner"

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

interface JobsManagementProps {
  recruiterId: string
}

export function JobsManagement({ recruiterId }: JobsManagementProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("active")
  const [loading, setLoading] = useState(true)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    jobId: string
    jobTitle: string
    action: "pause" | "close"
  }>({
    open: false,
    jobId: "",
    jobTitle: "",
    action: "pause",
  })

  // Carregar vagas
  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true)
        const jobsData = await getRecruiterJobs(recruiterId)
        setJobs(jobsData)
        setFilteredJobs(jobsData)
      } catch (error) {
        console.error("Erro ao carregar vagas:", error)
        toast.error("Erro ao carregar vagas")
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [recruiterId])

  // Filtrar vagas
  useEffect(() => {
    let filtered = jobs

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter)
    }

    setFilteredJobs(filtered)
  }, [jobs, searchTerm, statusFilter])

  const handleStatusChange = async (jobId: string, newStatus: "active" | "paused" | "closed") => {
    try {
      await updateJobStatus(jobId, newStatus)

      // Atualizar estado local
      setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job)))

      toast.success(
        newStatus === "active"
          ? "Vaga reativada com sucesso!"
          : newStatus === "paused"
            ? "Vaga pausada com sucesso!"
            : "Vaga encerrada com sucesso!",
      )
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast.error("Erro ao atualizar status da vaga")
    }
  }

  const openConfirmDialog = (jobId: string, jobTitle: string, action: "pause" | "close") => {
    setConfirmDialog({
      open: true,
      jobId,
      jobTitle,
      action,
    })
  }

  const handleConfirm = () => {
    const { jobId, action } = confirmDialog
    const newStatus = action === "pause" ? "paused" : "closed"
    handleStatusChange(jobId, newStatus)
    setConfirmDialog({ open: false, jobId: "", jobTitle: "", action: "pause" })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pesquisa e Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Pesquisar por título, empresa ou localização..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="paused">Pausadas</SelectItem>
            <SelectItem value="closed">Encerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Vagas - Grid no desktop, lista no mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {jobs.length === 0 ? "Nenhuma vaga encontrada." : "Nenhuma vaga corresponde aos filtros aplicados."}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onConfirmAction={openConfirmDialog} />
          ))
        )}
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.action === "pause" ? "Pausar Vaga" : "Encerrar Vaga"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "pause" ? (
                <>
                  Tem certeza que deseja pausar a vaga "{confirmDialog.jobTitle}"?
                  <br />
                  <br />A vaga será removida do feed e não receberá mais candidaturas até ser reativada. Você pode
                  reativar esta vaga a qualquer momento.
                </>
              ) : (
                <>
                  Tem certeza que deseja encerrar a vaga "{confirmDialog.jobTitle}"?
                  <br />
                  <br />
                  <span className="text-red-600 font-semibold">⚠️ ATENÇÃO: Esta ação é irreversível!</span>
                  <br />
                  Uma vez encerrada, a vaga não poderá ser reativada. A vaga será removida permanentemente do feed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmDialog.action === "close" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {confirmDialog.action === "pause" ? "Pausar Vaga" : "🔴 Encerrar Vaga"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function JobCard({
  job,
  onStatusChange,
  onConfirmAction,
}: {
  job: Job
  onStatusChange: (jobId: string, status: "active" | "paused" | "closed") => void
  onConfirmAction: (jobId: string, jobTitle: string, action: "pause" | "close") => void
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-gray-800">
            Ativa
          </Badge>
        )
      case "paused":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-gray-800">
            Pausada
          </Badge>
        )
      case "closed":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            Encerrada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getStatusBadge(job.status)}

            {/* Menu de Ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/post/${job.id}`} target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link href={`/job-candidates/${job.id}`}>
                    <Users className="w-4 h-4 mr-2" />
                    Ver Candidatos ({job.applications_count || 0})
                  </Link>
                </DropdownMenuItem>

                {job.status === "active" && (
                  <>
                    <DropdownMenuItem onClick={() => onConfirmAction(job.id, job.title, "pause")}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onConfirmAction(job.id, job.title, "close")}>
                      <X className="w-4 h-4 mr-2" />
                      Encerrar
                    </DropdownMenuItem>
                  </>
                )}

                {job.status === "paused" && (
                  <>
                    <DropdownMenuItem onClick={() => onStatusChange(job.id, "active")}>
                      <Play className="w-4 h-4 mr-2" />
                      Reativar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onConfirmAction(job.id, job.title, "close")}>
                      <X className="w-4 h-4 mr-2" />
                      Encerrar
                    </DropdownMenuItem>
                  </>
                )}

                {job.status === "closed" && (
                  <DropdownMenuItem disabled>
                    <X className="w-4 h-4 mr-2" />
                    Encerrada (Irreversível)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{job.title}</h3>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium truncate">{job.company}</p>
            <CityDisplay cityId={job.city_id} fallback={job.location} className="text-xs" />
            <p>Criada em {new Date(job.created_at).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {job.views_count || 0}
            </span>
            <span className="flex items-center gap-1">👥 {job.applications_count || 0}</span>
            <span className="flex items-center gap-1">❤️ {job.likes_count || 0}</span>
          </div>

          {job.applications_count > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>📄 {job.platform_applications_count || 0}</span>
              <span>💬 {job.external_applications_count || 0}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
