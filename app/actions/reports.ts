"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export const REPORT_REASONS = [
  "Linguagem ofensiva",
  "Dados desatualizados",
  "Redirecionamento suspeito",
  "Vaga inexistente",
  "Uso de identidade falsa",
  "Outro",
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

interface ReportJobResult {
  success: boolean
  error?: string
  alreadyReported?: boolean
}

export async function reportJob(
  vagaId: string,
  motivo: ReportReason,
  descricaoPersonalizada?: string,
): Promise<ReportJobResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "unauthenticated" }
  }

  if (!REPORT_REASONS.includes(motivo)) {
    return { success: false, error: "Motivo inválido." }
  }

  const descricao = descricaoPersonalizada?.trim().slice(0, 80) || null

  if (motivo === "Outro" && !descricao) {
    return { success: false, error: "Descreva o motivo da denúncia." }
  }

  try {
    const { error } = await supabase.from("denuncias_vagas").insert({
      vaga_id: vagaId,
      usuario_id: user.id,
      motivo,
      descricao_personalizada: descricao,
    })

    if (error) {
      // Violação da constraint única (vaga_id + usuario_id): já denunciou antes.
      if (error.code === "23505") {
        return { success: false, alreadyReported: true, error: "Você já denunciou esta vaga." }
      }
      throw new Error(error.message)
    }

    revalidatePath("/")
    revalidatePath("/feed")

    return { success: true }
  } catch (error) {
    console.error("Erro ao denunciar vaga:", error)
    return { success: false, error: "Erro ao enviar denúncia. Tente novamente." }
  }
}

/**
 * Retorna o conjunto de IDs de vagas que o usuário logado já denunciou.
 * Usado para marcar o botão de denúncia como "já denunciado" no feed.
 */
export async function getUserReportedJobIds(): Promise<string[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase.from("denuncias_vagas").select("vaga_id").eq("usuario_id", user.id)

  if (error) {
    console.error("Erro ao buscar denúncias do usuário:", error)
    return []
  }

  return (data || []).map((row) => row.vaga_id as string)
}
