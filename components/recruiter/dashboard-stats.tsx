"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getDashboardStats, getJobStatusCounts } from "@/app/actions/dashboard"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DashboardStats, JobStatusCounts } from "@/types/dashboard"
import { Briefcase, Users, Eye, TrendingUp, Calendar, Clock, CheckCircle, Heart } from "lucide-react"

interface DashboardStatsProps {
  recruiterId: string
}

export function DashboardStatsComponent({ recruiterId }: DashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [jobStatusCounts, setJobStatusCounts] = useState<JobStatusCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, statusData] = await Promise.all([
          getDashboardStats(recruiterId),
          getJobStatusCounts(recruiterId),
        ])

        setStats(statsData)
        setJobStatusCounts(statusData)
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [recruiterId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-muted-foreground">Erro ao carregar estatísticas</div>
  }

  // Preparar dados para o gráfico de candidaturas por período
  const applicationsData = [
    { name: "Hoje", value: stats.applicationsToday },
    { name: "Esta Semana", value: stats.applicationsThisWeek },
    { name: "Este Mês", value: stats.applicationsThisMonth },
  ]

  // Preparar dados para o gráfico de status por vaga
  const statusChartData = jobStatusCounts.slice(0, 5).map((job) => ({
    name: job.jobTitle.length > 20 ? job.jobTitle.substring(0, 20) + "..." : job.jobTitle,
    Pendente: job.pending,
    Analisando: job.reviewing,
    "Pré-selecionado": job.shortlisted,
    Rejeitado: job.rejected,
    Contratado: job.hired,
  }))

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vagas Ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalActiveJobs}</p>
              </div>
              <Briefcase className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vagas Pausadas</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalPausedJobs}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vagas Encerradas</p>
                <p className="text-2xl font-bold text-gray-600">{stats.totalClosedJobs}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Visualizações</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Curtidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalLikes}</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Candidaturas Hoje</p>
                <p className="text-2xl font-bold text-purple-600">{stats.applicationsToday}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Esta Semana</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.applicationsThisWeek}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Candidaturas</p>
                <p className="text-2xl font-bold text-pink-600">{stats.totalApplications}</p>
              </div>
              <Users className="w-8 h-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Candidaturas por Período */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Candidaturas por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={applicationsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Status por Vaga */}
        {statusChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status dos Candidatos por Vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Pendente" stackId="a" fill="#fbbf24" />
                  <Bar dataKey="Analisando" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="Pré-selecionado" stackId="a" fill="#10b981" />
                  <Bar dataKey="Rejeitado" stackId="a" fill="#ef4444" />
                  <Bar dataKey="Contratado" stackId="a" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
