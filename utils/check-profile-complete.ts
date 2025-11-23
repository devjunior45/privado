import type { UserProfile } from "@/types/profile"

export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false

  // Verificar se todos os campos obrigatórios estão preenchidos
  const requiredFields = [
    profile.full_name,
    profile.city,
    profile.state,
    profile.birth_date,
    profile.education && Array.isArray(profile.education) && profile.education.length > 0,
    profile.experiences !== null, // Pode ser array vazio se is_first_job = true
    profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0,
    profile.cnh_types !== null, // Pode ser array vazio
    profile.is_first_job !== null && profile.is_first_job !== undefined,
    profile.professional_summary,
    profile.address,
  ]

  return requiredFields.every((field) => field)
}

export function getMissingFields(profile: UserProfile | null): string[] {
  if (!profile) return ["all"]

  const missing: string[] = []

  if (!profile.full_name) missing.push("full_name")
  if (!profile.city) missing.push("city")
  if (!profile.state) missing.push("state")
  if (!profile.birth_date) missing.push("birth_date")
  if (!profile.education || !Array.isArray(profile.education) || profile.education.length === 0)
    missing.push("education")
  if (profile.experiences === null) missing.push("experiences")
  if (!profile.skills || !Array.isArray(profile.skills) || profile.skills.length === 0) missing.push("skills")
  if (profile.cnh_types === null) missing.push("cnh_types")
  if (profile.is_first_job === null || profile.is_first_job === undefined) missing.push("is_first_job")
  if (!profile.professional_summary) missing.push("professional_summary")
  if (!profile.address) missing.push("address")

  return missing
}
