"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function toggleSaveJob(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    // Verificar se já salvou
    const { data: existingSave } = await supabase
      .from("saved_jobs")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single()

    let wasSaved = false

    if (existingSave) {
      // Remover dos salvos
      const { error } = await supabase.from("saved_jobs").delete().eq("post_id", postId).eq("user_id", user.id)

      if (error) {
        throw new Error("Erro ao remover vaga dos salvos: " + error.message)
      }
    } else {
      // Adicionar aos salvos
      const { error } = await supabase.from("saved_jobs").insert({
        post_id: postId,
        user_id: user.id,
      })

      if (error) {
        throw new Error("Erro ao salvar vaga: " + error.message)
      }

      wasSaved = true
    }

    revalidatePath("/")
    revalidatePath("/feed")
    revalidatePath("/saved")

    return { wasSaved }
  } catch (error) {
    console.error("Erro na operação de salvar:", error)
    throw error
  }
}

export async function getSavedJobs() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: savedJobs, error } = await supabase
    .from("saved_jobs")
    .select(
      `
      *,
      job_posts (
        id,
        title,
        company,
        location,
        salary,
        description,
        image_url,
        background_color,
        created_at,
        likes_count
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar vagas salvas:", error)
    return []
  }

  return savedJobs || []
}
