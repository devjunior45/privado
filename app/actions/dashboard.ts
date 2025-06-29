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
    const { data: jobs, error } = await supabase
      .from("job_posts")
      .select(`
      *,
      job_applications (
        id,
        status,
        application_type
      )
    `)
      .eq("author_id", recruiterId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar vagas:", error)
      return []
    }

    // Processar dados para incluir contadores
    const processedJobs = jobs?.map((job) => ({
      ...job,
      applications_count: job.job_applications?.length || 0,
      platform_applications_count:
        job.job_applications?.filter((app: any) => app.application_type === "platform").length || 0,
      external_applications_count:
        job.job_applications?.filter((app: any) => app.application_type === "external").length || 0,
      pending_count: job.job_applications?.filter((app: any) => app.status === "pending").length || 0,
      interview_count: job.job_applications?.filter((app: any) => app.status === "interview").length || 0,
      hired_count: job.job_applications?.filter((app: any) => app.status === "hired").length || 0,
      rejected_count: job.job_applications?.filter((app: any) => app.status === "rejected").length || 0,
    }))

    return processedJobs || []
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

    // Buscar visualizações detalhadas
    const { data: views, error } = await supabase
      .from("job_views")
      .select(`
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar visualizações:", error)
      return []
    }

    return views || []
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

    revalidatePath("/dashboard")
    revalidatePath("/feed")
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
    // Se há usuário, verificar se já visualizou hoje
    if (userId) {
      const today = new Date().toISOString().split("T")[0]
      const { data: existingView } = await supabase
        .from("job_views")
        .select("id")
        .eq("job_id", jobId)
        .eq("user_id", userId)
        .gte("created_at", today)
        .single()

      if (existingView) {
        return // Já visualizou hoje
      }

      // Registrar nova visualização
      await supabase.from("job_views").insert({
        job_id: jobId,
        user_id: userId,
      })
    }

    // Incrementar contador
    await supabase.rpc("increment_job_views", { job_id: jobId })
  } catch (error) {
    console.error("Erro ao rastrear visualização:", error)
    // Não falhar silenciosamente para não afetar a experiência do usuário
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
