"use server"

import { createClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createJobPost(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  // Verificar perfil do usuário
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_type, is_verified")
    .eq("id", user.id)
    .single()

  if (profileError) {
    throw new Error("Erro ao buscar perfil do usuário")
  }

  // Se for recrutador NÃO verificado, verificar limite de vagas
  if (profile.user_type === "recruiter" && !profile.is_verified) {
    const { data: activeJobs, error: jobsError } = await supabase
      .from("job_posts")
      .select("id")
      .eq("author_id", user.id)
      .eq("status", "active")

    if (jobsError) {
      throw new Error("Erro ao verificar vagas ativas")
    }

    // Se já tem 1 ou mais vagas ativas, não permite criar nova
    if (activeJobs && activeJobs.length >= 1) {
      throw new Error(
        "Recrutadores não verificados podem ter apenas 1 vaga ativa. Solicite a verificação da sua conta ou pause/encerre uma vaga existente para criar uma nova.",
      )
    }
  }

  const title = formData.get("title") as string
  const company = formData.get("company") as string
  const cityId = Number.parseInt(formData.get("cityId") as string) || null
  const salary = formData.get("salary") as string
  const description = formData.get("description") as string
  const backgroundColor = formData.get("backgroundColor") as string
  const allowPlatformApplications = formData.get("allowPlatformApplications") === "true"
  const imageFile = formData.get("image") as File
  const sectorIds = JSON.parse((formData.get("sector_ids") as string) || "[]")

  // Validar cidade
  if (!cityId) {
    throw new Error("Cidade é obrigatória")
  }

  let imageUrl = null

  // Upload da imagem se fornecida
  if (imageFile && imageFile.size > 0) {
    const blob = await put(`job-images/${Date.now()}-${imageFile.name}`, imageFile, {
      access: "public",
    })
    imageUrl = blob.url
  }

  // Buscar informações da cidade para o campo location (para compatibilidade)
  const { data: city } = await supabase.from("cities").select("name, state").eq("id", cityId).single()
  const location = city ? `${city.name}, ${city.state}` : ""

  const { error } = await supabase.from("job_posts").insert({
    title,
    company,
    city_id: cityId,
    location,
    salary: salary || null,
    description,
    image_url: imageUrl,
    background_color: backgroundColor || "#3b82f6",
    allow_platform_applications: allowPlatformApplications,
    author_id: user.id,
    status: "active",
    sector_ids: sectorIds,
  })

  if (error) {
    throw new Error("Erro ao criar post: " + error.message)
  }

  revalidatePath("/")
  revalidatePath("/feed")
  revalidatePath("/dashboard")
}

export async function toggleLike(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  // Verificar se já curtiu
  const { data: existingLike } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single()

  if (existingLike) {
    // Remover curtida
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id)

    // Decrementar contador
    await supabase.rpc("decrement_likes", { post_id: postId })
  } else {
    // Adicionar curtida
    await supabase.from("post_likes").insert({
      post_id: postId,
      user_id: user.id,
    })

    // Incrementar contador
    await supabase.rpc("increment_likes", { post_id: postId })
  }

  revalidatePath("/")
  revalidatePath("/feed")
}

export async function getPosts(cityId?: number | null, userId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("job_posts")
    .select(`
      *,
      profiles (
        id,
        username,
        full_name,
        avatar_url,
        company_name,
        whatsapp
      ),
      post_likes!left (
        user_id
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  // Filtrar por cidade se especificado
  if (cityId !== null && cityId !== undefined) {
    query = query.eq("city_id", cityId)
  }

  const { data: posts, error } = await query

  if (error) {
    console.error("Erro ao buscar posts:", error)
    return []
  }

  // Processar posts para adicionar informações de curtida
  const processedPosts = posts?.map((post) => ({
    ...post,
    is_liked: userId ? post.post_likes.some((like: any) => like.user_id === userId) : false,
  }))

  return processedPosts || []
}

export async function updateJobStatus(jobId: string, status: "active" | "paused" | "closed") {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const { error } = await supabase.from("job_posts").update({ status }).eq("id", jobId).eq("author_id", user.id)

  if (error) {
    throw new Error("Erro ao atualizar status da vaga: " + error.message)
  }

  revalidatePath("/dashboard")
  revalidatePath("/feed")
}

export async function incrementJobViews(jobId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Verificar se já visualizou hoje
  const today = new Date().toISOString().split("T")[0]

  if (user) {
    const { data: existingView } = await supabase
      .from("job_views")
      .select("id")
      .eq("job_id", jobId)
      .eq("user_id", user.id)
      .gte("created_at", today)
      .single()

    if (existingView) {
      return
    }

    // Registrar nova visualização (se a tabela existir)
    const { error: insertError } = await supabase.from("job_views").insert({
      job_id: jobId,
      user_id: user.id,
    })

    if (insertError) {
      console.error("Erro ao registrar visualização:", insertError)
    }
  }

  // Tentar incrementar contador usando a função SQL
  const { error } = await supabase.rpc("increment_job_views", { job_id: jobId })

  if (error) {
    console.error("Função increment_job_views não encontrada:", error.message)
  }
}
