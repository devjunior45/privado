"use server"

import { createClient } from "@/lib/supabase/server"
import { put, del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Experience, Education, Course } from "@/types/profile"
import { generateResumePDF } from "@/utils/generate-pdf"

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const isFirstJob = formData.get("isFirstJob")

  const fullName = formData.get("fullName") as string
  const cityId = formData.get("cityId") ? Number.parseInt(formData.get("cityId") as string) : null
  const whatsapp = formData.get("whatsapp") as string
  const email = formData.get("email") as string
  const professionalSummary = formData.get("professionalSummary") as string
  const cnhTypes = formData.getAll("cnhTypes") as string[]
  const avatarFile = formData.get("avatar") as File

  let avatarUrl = null

  // Upload da foto de perfil se fornecida
  if (avatarFile && avatarFile.size > 0) {
    try {
      // Buscar avatar atual para deletar
      const { data: currentProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

      // Deletar avatar antigo se existir
      if (currentProfile?.avatar_url) {
        try {
          await del(currentProfile.avatar_url)
        } catch (error) {
          console.log("Erro ao deletar avatar antigo:", error)
        }
      }

      // Upload do novo avatar
      const fileExtension = avatarFile.name.split(".").pop()
      const fileName = `avatars/${user.id}-${Date.now()}.${fileExtension}`

      const blob = await put(fileName, avatarFile, {
        access: "public",
      })
      avatarUrl = blob.url
    } catch (error) {
      console.error("Erro no upload do avatar:", error)
      throw new Error("Erro ao fazer upload da imagem")
    }
  }

  // Buscar informações da cidade para os campos city e state (para compatibilidade)
  let city = null
  let state = null

  if (cityId) {
    const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", cityId).single()
    if (cityData) {
      city = cityData.name
      state = cityData.state
    }
  }

  const updateData: any = {
    full_name: fullName,
    city_id: cityId,
    city, // Mantemos para compatibilidade
    state, // Mantemos para compatibilidade
    whatsapp,
    email,
    professional_summary: professionalSummary,
    cnh_types: cnhTypes,
  }

  if (isFirstJob !== null) {
    updateData.is_first_job = isFirstJob === "true"
  }

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)

  if (error) {
    console.error("Erro ao atualizar perfil:", error)
    throw new Error("Erro ao atualizar perfil: " + error.message)
  }

  revalidatePath("/profile")
}

export async function updateRecruiterProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const companyName = formData.get("companyName") as string
  const cnpj = formData.get("cnpj") as string
  const cityId = formData.get("cityId") ? Number.parseInt(formData.get("cityId") as string) : null
  const whatsapp = formData.get("whatsapp") as string
  const email = formData.get("email") as string
  const description = formData.get("description") as string
  const avatarFile = formData.get("avatar") as File

  // Validações obrigatórias
  if (!companyName || !whatsapp || !email || !cityId) {
    throw new Error("Nome da empresa, WhatsApp, email e cidade são obrigatórios")
  }

  let avatarUrl = null

  // Upload da logo se fornecida
  if (avatarFile && avatarFile.size > 0) {
    try {
      // Buscar avatar atual para deletar
      const { data: currentProfile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single()

      // Deletar avatar antigo se existir
      if (currentProfile?.avatar_url) {
        try {
          await del(currentProfile.avatar_url)
        } catch (error) {
          console.log("Erro ao deletar avatar antigo:", error)
        }
      }

      // Upload do novo avatar
      const fileExtension = avatarFile.name.split(".").pop()
      const fileName = `company-logos/${user.id}-${Date.now()}.${fileExtension}`

      const blob = await put(fileName, avatarFile, {
        access: "public",
      })
      avatarUrl = blob.url
    } catch (error) {
      console.error("Erro no upload da logo:", error)
      throw new Error("Erro ao fazer upload da imagem")
    }
  }

  // Buscar informações da cidade
  let city = null
  let state = null

  if (cityId) {
    const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", cityId).single()
    if (cityData) {
      city = cityData.name
      state = cityData.state
    }
  }

  const updateData: any = {
    company_name: companyName,
    cnpj: cnpj || null,
    city_id: cityId,
    city,
    state,
    company_location: city && state ? `${city}, ${state}` : null,
    whatsapp,
    email,
    professional_summary: description,
  }

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)

  if (error) {
    console.error("Erro ao atualizar perfil:", error)
    throw new Error("Erro ao atualizar perfil: " + error.message)
  }

  revalidatePath("/profile")
}

export async function requestVerification(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const companyName = formData.get("companyName") as string
  const cnpj = formData.get("cnpj") as string
  const contactPhone = formData.get("contactPhone") as string
  const contactEmail = formData.get("contactEmail") as string
  const message = formData.get("message") as string

  // Validações obrigatórias
  if (!companyName || !contactPhone) {
    throw new Error("Nome da empresa e telefone de contato são obrigatórios")
  }

  // Verificar se já existe uma solicitação pendente
  const { data: existingRequest } = await supabase
    .from("verification_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single()

  if (existingRequest) {
    throw new Error("Você já possui uma solicitação de verificação pendente")
  }

  // Inserir nova solicitação de verificação
  const { error: requestError } = await supabase.from("verification_requests").insert({
    user_id: user.id,
    company_name: companyName,
    cnpj: cnpj || null,
    contact_phone: contactPhone,
    contact_email: contactEmail || null,
    message: message || null,
    status: "pending",
  })

  if (requestError) {
    console.error("Erro ao criar solicitação:", requestError)
    throw new Error("Erro ao solicitar verificação: " + requestError.message)
  }

  revalidatePath("/profile")
}

export async function updateSkills(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const skills = formData.get("skills") as string

  // Processar habilidades (separar por vírgula)
  const skillsArray = skills
    ? skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
    : []

  const { error } = await supabase.from("profiles").update({ skills: skillsArray }).eq("id", user.id)

  if (error) {
    console.error("Erro ao atualizar habilidades:", error)
    throw new Error("Erro ao atualizar habilidades: " + error.message)
  }

  revalidatePath("/profile")
}

export async function addExperience(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const isFirstJob = formData.get("isFirstJob")

  const position = formData.get("position") as string
  const company = formData.get("company") as string
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string
  const isCurrentJob = formData.get("isCurrentJob") === "true"
  const activities = formData.get("activities") as string

  // Buscar experiências atuais
  const { data: profile } = await supabase.from("profiles").select("experiences").eq("id", user.id).single()

  // Se estava marcado como primeiro emprego, desmarcar
  if (isFirstJob === "false") {
    const { error: firstJobError } = await supabase.from("profiles").update({ is_first_job: false }).eq("id", user.id)

    if (firstJobError) {
      console.error("Erro ao desmarcar primeiro emprego:", firstJobError)
    }
  }

  const currentExperiences = (profile?.experiences as Experience[]) || []
  const newExperience: Experience = {
    position,
    company: company || undefined,
    startDate: startDate || undefined,
    endDate: isCurrentJob ? undefined : endDate || undefined,
    isCurrentJob,
    activities: activities || undefined,
  }

  const updatedExperiences = [...currentExperiences, newExperience]

  const { error } = await supabase.from("profiles").update({ experiences: updatedExperiences }).eq("id", user.id)

  if (error) {
    throw new Error("Erro ao adicionar experiência: " + error.message)
  }

  revalidatePath("/profile")
}

export async function addEducation(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const level = formData.get("level") as string
  const institution = formData.get("institution") as string
  const completionYear = formData.get("completionYear") as string
  const status = (formData.get("status") as string) || "concluído"
  const courseName = formData.get("courseName") as string

  // Buscar educação atual
  const { data: profile } = await supabase.from("profiles").select("education").eq("id", user.id).single()

  const currentEducation = (profile?.education as Education[]) || []
  const newEducation: Education = {
    level,
    institution,
    completionYear: status === "concluído" ? completionYear || undefined : undefined,
    isComplete: status === "concluído", // Mantém compatibilidade
    status: status as "cursando" | "incompleto" | "concluído",
    courseName: courseName || undefined,
  }

  const updatedEducation = [...currentEducation, newEducation]

  const { error } = await supabase.from("profiles").update({ education: updatedEducation }).eq("id", user.id)

  if (error) {
    throw new Error("Erro ao adicionar formação: " + error.message)
  }

  revalidatePath("/profile")
}

export async function addCourse(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const name = formData.get("name") as string
  const institution = formData.get("institution") as string
  const completionYear = formData.get("completionYear") as string
  const duration = formData.get("duration") as string
  const isComplete = formData.get("isComplete") === "true"

  if (!name || name.trim() === "") {
    throw new Error("Nome do curso é obrigatório")
  }

  if (!institution || institution.trim() === "") {
    throw new Error("Instituição é obrigatória")
  }

  // Buscar cursos atuais
  const { data: profile } = await supabase.from("profiles").select("courses").eq("id", user.id).single()

  const currentCourses = (profile?.courses as Course[]) || []
  const newCourse: Course = {
    name: name.trim(),
    institution: institution.trim(),
    completionYear: completionYear?.trim() || undefined,
    duration: duration?.trim() || undefined,
    isComplete,
  }

  const updatedCourses = [...currentCourses, newCourse]

  const { error } = await supabase.from("profiles").update({ courses: updatedCourses }).eq("id", user.id)

  if (error) {
    console.error("Erro no banco ao adicionar curso:", error)
    throw new Error("Erro ao adicionar curso: " + error.message)
  }

  revalidatePath("/profile")
}

export async function removeExperience(index: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const { data: profile } = await supabase.from("profiles").select("experiences").eq("id", user.id).single()

  const currentExperiences = (profile?.experiences as Experience[]) || []
  const updatedExperiences = currentExperiences.filter((_, i) => i !== index)

  const { error } = await supabase.from("profiles").update({ experiences: updatedExperiences }).eq("id", user.id)

  if (error) {
    throw new Error("Erro ao remover experiência: " + error.message)
  }

  revalidatePath("/profile")
}

export async function removeEducation(index: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const { data: profile } = await supabase.from("profiles").select("education").eq("id", user.id).single()

  const currentEducation = (profile?.education as Education[]) || []
  const updatedEducation = currentEducation.filter((_, i) => i !== index)

  const { error } = await supabase.from("profiles").update({ education: updatedEducation }).eq("id", user.id)

  if (error) {
    throw new Error("Erro ao remover escolaridade: " + error.message)
  }

  revalidatePath("/profile")
}

export async function removeCourse(index: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  const { data: profile } = await supabase.from("profiles").select("courses").eq("id", user.id).single()

  const currentCourses = (profile?.courses as Course[]) || []
  const updatedCourses = currentCourses.filter((_, i) => i !== index)

  const { error } = await supabase.from("profiles").update({ courses: updatedCourses }).eq("id", user.id)

  if (error) {
    throw new Error("Erro ao remover curso: " + error.message)
  }

  revalidatePath("/profile")
}

export async function applyToJobPlatform(jobId: string, message?: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth")
  }

  console.log("🔄 Aplicando para vaga pela plataforma:", { jobId, userId: user.id })

  try {
    // Verificar se já se candidatou
    const { data: existingApplication } = await supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("job_id", jobId)
      .single()

    if (existingApplication) {
      throw new Error("Você já se candidatou para esta vaga")
    }

    // Buscar perfil completo do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("❌ Erro ao buscar perfil:", profileError)
      throw new Error("Perfil não encontrado")
    }

    console.log("📄 Gerando PDF do currículo...")

    // Gerar PDF do currículo
    const pdfDataUrl = await generateResumePDF(profile)

    // Converter data URL para blob
    const response = await fetch(pdfDataUrl)
    const blob = await response.blob()

    console.log("☁️ Fazendo upload do PDF...")

    // Upload do PDF para o Blob storage
    const fileName = `resumes/${user.id}-${jobId}-${Date.now()}.pdf`
    const uploadedBlob = await put(fileName, blob, {
      access: "public",
      contentType: "application/pdf",
    })

    console.log("💾 Salvando candidatura no banco...")

    // Salvar candidatura com URL do currículo
    const { error: applicationError } = await supabase.from("job_applications").insert({
      user_id: user.id,
      job_id: jobId,
      message: message || null,
      application_type: "platform",
      resume_pdf_url: uploadedBlob.url,
      status: "pending",
    })

    if (applicationError) {
      console.error("❌ Erro ao salvar candidatura:", applicationError)
      // Se falhar ao salvar, deletar o arquivo
      try {
        await del(uploadedBlob.url)
      } catch (deleteError) {
        console.error("Erro ao deletar arquivo:", deleteError)
      }
      throw new Error("Erro ao se candidatar: " + applicationError.message)
    }

    console.log("✅ Candidatura pela plataforma realizada com sucesso")
    revalidatePath("/")
    return { success: true, resumeUrl: uploadedBlob.url }
  } catch (error) {
    console.error("❌ Erro na candidatura:", error)
    throw error
  }
}
