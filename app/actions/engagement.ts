"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function registerJobView(jobId: string, userAgent?: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Registrar visualização usando a função SQL
    const { error } = await supabase.rpc("register_job_view", {
      p_job_id: jobId,
      p_user_id: user?.id || null,
      p_user_agent: userAgent || null,
    })

    if (error) {
      console.error("Erro ao registrar visualização:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao registrar visualização:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function toggleJobLike(jobId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    // Toggle curtida usando a função SQL
    const { data, error } = await supabase.rpc("toggle_job_like", {
      p_job_id: jobId,
      p_user_id: user.id,
    })

    if (error) {
      console.error("Erro ao curtir/descurtir:", error)
      return { success: false, error: error.message }
    }

    // Revalidar páginas relevantes
    revalidatePath("/feed")
    revalidatePath("/dashboard")
    revalidatePath(`/job/${jobId}`)

    return { success: true, liked: data }
  } catch (error) {
    console.error("Erro ao curtir/descurtir:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function getJobEngagementStats(jobId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    // Buscar estatísticas da vaga
    const { data: jobData, error: jobError } = await supabase
      .from("job_posts")
      .select("views_count, likes_count, author_id")
      .eq("id", jobId)
      .single()

    if (jobError) {
      return { success: false, error: jobError.message }
    }

    // Verificar se o usuário é o autor da vaga
    if (jobData.author_id !== user.id) {
      return { success: false, error: "Acesso negado" }
    }

    // Buscar visualizações detalhadas
    const { data: viewsData, error: viewsError } = await supabase
      .from("job_views")
      .select(`
        id,
        viewed_at,
        user_id,
        profiles:user_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .eq("job_id", jobId)
      .order("viewed_at", { ascending: false })
      .limit(50)

    if (viewsError) {
      console.error("Erro ao buscar visualizações:", viewsError)
    }

    // Buscar curtidas detalhadas
    const { data: likesData, error: likesError } = await supabase
      .from("job_likes")
      .select(`
        id,
        liked_at,
        user_id,
        profiles:user_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .eq("job_id", jobId)
      .order("liked_at", { ascending: false })
      .limit(50)

    if (likesError) {
      console.error("Erro ao buscar curtidas:", likesError)
    }

    return {
      success: true,
      stats: {
        views_count: jobData.views_count || 0,
        likes_count: jobData.likes_count || 0,
        recent_views: viewsData || [],
        recent_likes: likesData || [],
      },
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function checkUserLikedJob(jobId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: true, liked: false }
    }

    const { data, error } = await supabase
      .from("job_likes")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao verificar curtida:", error)
      return { success: false, error: error.message }
    }

    return { success: true, liked: !!data }
  } catch (error) {
    console.error("Erro ao verificar curtida:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}
