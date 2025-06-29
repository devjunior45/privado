"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface JobStatisticsProps {
  recruiterId: string
}

interface StatData {
  totalJobs: number
  totalApplications: number
  totalLikes: number
  applicationsByJob: { title: string; count: number }[]
  recentActivity: { date: string; applications: number; likes: number }[]
}

export function JobStatistics({ recruiterId }: JobStatisticsProps) {
  const [stats, setStats] = useState<StatData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        // Buscar vagas do recrutador
        const { data: jobs } = await supabase
          .from("job_posts")
          .select("id, title, created_at, likes_count")
          .eq("author_id", recruiterId)

        if (!jobs || jobs.length === 0) {
          setStats({
            totalJobs: 0,
            totalApplications: 0,
            totalLikes: 0,
            applicationsByJob: [],
            recentActivity: [],
          })
          return
        }

        // Buscar candidaturas para cada vaga
        const applicationPromises = jobs.map((job) =>
          supabase
            .from("job_applications")
            .select("*", { count: "exact" })
            .eq("post_id", job.id)
            .then(({ count }) => ({ jobId: job.id, jobTitle: job.title, count: count || 0 })),
        )

        const applicationsData = await Promise.all(applicationPromises)

        // Calcular estatísticas
        const totalJobs = jobs.length
        const totalApplications = applicationsData.reduce((sum, item) => sum + item.count, 0)
        const totalLikes = jobs.reduce((sum, job) => sum + (job.likes_count || 0), 0)

        // Aplicações por vaga
        const applicationsByJob = applicationsData
          .map((item) => ({ title: item.jobTitle, count: item.count }))
          .sort((a, b) => b.count - a.count)

        // Atividade recente (últimos 7 dias)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - i)
          return date.toISOString().split("T")[0]
        }).reverse()

        const recentActivity = last7Days.map((date) => {
          // Simplificado para demonstração - idealmente buscaríamos dados reais por data
          return {
            date,
            applications: Math.floor(Math.random() * 5), // Dados simulados
            likes: Math.floor(Math.random() * 10), // Dados simulados
          }
        })

        setStats({
          totalJobs,
          totalApplications,
          totalLikes,
          applicationsByJob,
          recentActivity,
        })
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [recruiterId, supabase])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
    )
  }

  if (!stats) {
    return <p className="text-center text-muted-foreground">Não foi possível carregar as estatísticas.</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {stats.applicationsByJob.slice(0, 4).map((job) => (
          <Card key={job.title}>
            <CardContent className="p-4">
              <p className="text-sm font-medium truncate" title={job.title}>
                {job.title}
              </p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">Candidaturas</p>
                <p className="text-lg font-bold">{job.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Atividade Recente</p>
        <div className="h-[150px] w-full bg-muted rounded-md flex items-end justify-between p-4">
          {stats.recentActivity.map((day) => {
            const maxHeight = 100
            const appHeight = Math.max((day.applications / 5) * maxHeight, 10)
            const likeHeight = Math.max((day.likes / 10) * maxHeight, 10)

            return (
              <div key={day.date} className="flex flex-col items-center">
                <div className="flex gap-1">
                  <div
                    className="w-4 bg-blue-500 rounded-t"
                    style={{ height: `${appHeight}px` }}
                    title={`${day.applications} candidaturas`}
                  />
                  <div
                    className="w-4 bg-red-400 rounded-t"
                    style={{ height: `${likeHeight}px` }}
                    title={`${day.likes} curtidas`}
                  />
                </div>
                <p className="text-xs mt-1">{day.date.split("-")[2]}</p>
              </div>
            )
          })}
        </div>
        <div className="flex justify-center mt-2 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1" />
            <span className="text-xs">Candidaturas</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded mr-1" />
            <span className="text-xs">Curtidas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
