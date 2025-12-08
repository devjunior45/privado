"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function getDashboardStats(recruiterId: string) {
  const supabase = await createClient()

  try {
    // Buscar estatísticas das vagas com visualizações
    const { data: jobStats } = await supabase
      .from("job_posts")
      .select("status, views_count, likes_count")
      .eq("author_id", recruiterId)

    const stats = {
      totalActiveJobs: jobStats?.filter((job) => job.status === "active").length || 0,
      totalPausedJobs: jobStats?.filter((job) => job.status === "paused").length || 0,
      totalClosedJobs: jobStats?.filter((job) => job.status === "closed").length || 0,
      totalViews: jobStats?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0,
      totalLikes: jobStats?.reduce((sum, job) => sum + (job.likes_count || 0), 0) || 0,
    }

    // Buscar total de candidaturas
    const { data: jobs } = await supabase.from("job_posts").select("id").eq("author_id", recruiterId)
    const jobIds = jobs?.map((job) => job.id) || []

    if (jobIds.length > 0) {
      // Candidaturas hoje
      const today = new Date().toISOString().split("T")[0]
      const { count: applicationsToday } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobIds)
        .gte("created_at", today)

      // Candidaturas esta semana
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { count: applicationsThisWeek } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobIds)
        .gte("created_at", weekAgo.toISOString())

      // Candidaturas este mês
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const { count: applicationsThisMonth } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobIds)
        .gte("created_at", monthAgo.toISOString())

      // Total de candidaturas
      const { count: totalApplications } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobIds)

      stats.applicationsToday = applicationsToday || 0
      stats.applicationsThisWeek = applicationsThisWeek || 0
      stats.applicationsThisMonth = applicationsThisMonth || 0
      stats.totalApplications = totalApplications || 0
    } else {
      stats.applicationsToday = 0
      stats.applicationsThisWeek = 0
      stats.applicationsThisMonth = 0
      stats.totalApplications = 0
    }

    return stats
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return {
      totalActiveJobs: 0,
      totalPausedJobs: 0,
      totalClosedJobs: 0,
      totalViews: 0,
      totalLikes: 0,
      applicationsToday: 0,
      applicationsThisWeek: 0,
      applicationsThisMonth: 0,
      totalApplications: 0,
    }
  }
}

export async function getJobStatusCounts(recruiterId: string) {
  const supabase = await createClient()

  try {
    // Buscar as 5 vagas com mais candidaturas
    const { data: jobs } = await supabase
      .from("job_posts")
      .select(`
      id,
      title,
      job_applications (
        status
      )
    `)
      .eq("author_id", recruiterId)
      .order("created_at", { ascending: false })
      .limit(10)

    const jobStatusCounts =
      jobs?.map((job) => ({
        jobId: job.id,
        jobTitle: job.title,
        pending: job.job_applications?.filter((app: any) => app.status === "pending").length || 0,
        reviewing: job.job_applications?.filter((app: any) => app.status === "reviewing").length || 0,
        shortlisted: job.job_applications?.filter((app: any) => app.status === "shortlisted").length || 0,
        rejected: job.job_applications?.filter((app: any) => app.status === "rejected").length || 0,
        hired: job.job_applications?.filter((app: any) => app.status === "hired").length || 0,
      })) || []

    return jobStatusCounts
  } catch (error) {
    console.error("Erro ao buscar contadores de status:", error)
    return []
  }
}

export async function getRecruiterJobs(recruiterId: string) {
  const supabase = await createClient()

  try {
    // Usar a VIEW otimizada que já retorna os contadores calculados
    const { data: jobs, error } = await supabase
      .from("recruiter_jobs_with_stats")
      .select("*")
      .eq("author_id", recruiterId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar vagas:", error)
      return []
    }

    // Retornar diretamente - contadores já vêm da VIEW
    return jobs || []
  } catch (error) {
    console.error("Erro ao buscar vagas:", error)
    return []
  }
}

export async function getJobViews(jobId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    // Verificar se a vaga pertence ao usuário
    const { data: job } = await supabase
      .from("job_posts")
      .select("id, author_id")
      .eq("id", jobId)
      .eq("author_id", user.id)
      .single()

    if (!job) {
      throw new Error("Vaga não encontrada ou você não tem permissão")
    }

    // Retornar array vazio por enquanto até que a tabela job_views seja criada
    return []
  } catch (error) {
    console.error("Erro ao buscar visualizações:", error)
    return []
  }
}

export async function updateJobStatus(jobId: string, status: "active" | "paused" | "closed") {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    const { error } = await supabase.from("job_posts").update({ status }).eq("id", jobId).eq("author_id", user.id)

    if (error) {
      throw new Error("Erro ao atualizar status da vaga")
    }

    // Revalidar apenas o dashboard - não revalidar /feed para evitar bloqueio da UI
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar status:", error)
    throw error
  }
}

export async function cloneJob(jobId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    // Buscar a vaga original
    const { data: originalJob, error: fetchError } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", jobId)
      .eq("author_id", user.id) // Apenas o autor pode clonar
      .single()

    if (fetchError || !originalJob) {
      throw new Error("Vaga não encontrada ou você não tem permissão")
    }

    // Criar nova vaga com dados da original
    const { data: newJob, error: insertError } = await supabase
      .from("job_posts")
      .insert({
        title: `${originalJob.title} (Cópia)`,
        company: originalJob.company,
        location: originalJob.location,
        city_id: originalJob.city_id,
        salary: originalJob.salary,
        description: originalJob.description,
        image_url: originalJob.image_url,
        background_color: originalJob.background_color,
        allow_platform_applications: originalJob.allow_platform_applications,
        author_id: user.id,
        status: "active",
      })
      .select()
      .single()

    if (insertError) {
      throw new Error("Erro ao clonar vaga")
    }

    revalidatePath("/dashboard")
    return newJob
  } catch (error) {
    console.error("Erro ao clonar vaga:", error)
    throw error
  }
}

export async function getApplicationsWithCandidates(jobId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    // Verificar se a vaga pertence ao usuário
    const { data: job } = await supabase
      .from("job_posts")
      .select("id")
      .eq("id", jobId)
      .eq("author_id", user.id)
      .single()

    if (!job) {
      throw new Error("Vaga não encontrada ou você não tem permissão")
    }

    const { data: applications, error } = await supabase
      .from("job_applications")
      .select(`
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url,
        email,
        whatsapp,
        professional_summary,
        skills,
        education,
        experiences,
        city,
        city_id
      ),
      job_posts (
        id,
        title,
        company
      )
    `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar candidaturas:", error)
      return []
    }

    return applications || []
  } catch (error) {
    console.error("Erro ao buscar candidaturas:", error)
    return []
  }
}

export async function trackJobView(jobId: string, userId?: string) {
  const supabase = await createClient()

  try {
    // Incrementar diretamente no banco de dados sem usar RPC
    const { data: currentJob } = await supabase.from("job_posts").select("views_count").eq("id", jobId).single()

    if (currentJob) {
      await supabase
        .from("job_posts")
        .update({ views_count: (currentJob.views_count || 0) + 1 })
        .eq("id", jobId)
    }
  } catch (error) {
    // Falha silenciosa - não afetar experiência do usuário
    console.error("Erro ao rastrear visualização:", error)
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "pending" | "interview" | "hired" | "rejected",
  notes?: string,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    // Verificar se a candidatura pertence a uma vaga do usuário
    const { data: application } = await supabase
      .from("job_applications")
      .select(`
      id,
      job_id,
      job_posts (
        author_id
      )
    `)
      .eq("id", applicationId)
      .single()

    if (!application || application.job_posts?.author_id !== user.id) {
      throw new Error("Candidatura não encontrada ou você não tem permissão")
    }

    const { error } = await supabase
      .from("job_applications")
      .update({
        status,
        recruiter_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (error) {
      throw new Error("Erro ao atualizar status da candidatura")
    }

    revalidatePath("/dashboard")
    revalidatePath("/job-candidates")
    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar status:", error)
    throw error
  }
}

// Função auxiliar para buscar vagas com estatísticas (compatibilidade)
export async function getJobsWithStats(recruiterId: string) {
  return await getRecruiterJobs(recruiterId)
}
