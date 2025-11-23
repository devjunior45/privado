"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function saveOnboardingStep(step: string, data: Record<string, any>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const updateData: Record<string, any> = {}

  switch (step) {
    case "full_name":
      updateData.full_name = data.full_name
      break

    case "location":
      updateData.city = data.city
      updateData.state = data.state
      updateData.city_id = data.city_id || null
      break

    case "birth_date":
      updateData.birth_date = data.birth_date
      break

    case "education":
      // Buscar educação atual
      const { data: profileEdu } = await supabase.from("profiles").select("education").eq("id", user.id).single()
      const currentEducation = (profileEdu?.education as any[]) || []
      updateData.education = [...currentEducation, data.education]
      break

    case "experience":
      if (data.is_first_job) {
        updateData.experiences = []
        updateData.is_first_job = true
      } else {
        // Buscar experiências atuais
        const { data: profileExp } = await supabase.from("profiles").select("experiences").eq("id", user.id).single()
        const currentExperiences = (profileExp?.experiences as any[]) || []
        updateData.experiences = [...currentExperiences, data.experience]
        updateData.is_first_job = false
      }
      break

    case "skills":
      updateData.skills = data.skills
      break

    case "cnh":
      updateData.cnh_types = data.cnh_types
      break

    case "summary":
      updateData.professional_summary = data.professional_summary
      break

    case "address":
      updateData.address = data.address
      break
  }

  const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)

  if (error) {
    console.error("Erro ao salvar passo do onboarding:", error)
    throw new Error("Erro ao salvar dados: " + error.message)
  }

  revalidatePath("/onboarding")
  return { success: true }
}
