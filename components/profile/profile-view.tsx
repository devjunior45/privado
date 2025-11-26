"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Phone,
  Mail,
  Share2,
  Briefcase,
  GraduationCap,
  Award,
  Car,
  Calendar,
  Edit,
  Plus,
  Trash2,
  Loader2,
  ShieldCheck,
  Cake,
  Home,
} from "lucide-react"
import type { UserProfile, Experience, Education, Course } from "@/types/profile"
import { ResumePDF } from "./resume-pdf"
import {
  updateProfile,
  updateSkills,
  addExperience,
  addEducation,
  addCourse,
  removeExperience,
  removeEducation,
  removeCourse,
  updateFirstJobStatus,
} from "@/app/actions/profile"
import { CitySelect } from "@/components/ui/city-select"
import { CityDisplay } from "@/components/ui/city-display"
import { useToast } from "@/components/ui/toast"
import { compressImage } from "@/utils/compress-image"

interface ProfileViewProps {
  profile: UserProfile & { is_verified?: boolean; phone_visible?: boolean; email_visible?: boolean }
  isOwnProfile?: boolean
}

const EDUCATION_LEVELS = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Técnico",
  "Ensino Superior",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
]

const EDUCATION_STATUS = ["cursando", "incompleto", "concluído"]

const CNH_TYPES = ["A", "B", "AB", "C", "D", "E"]

// Função para calcular idade
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function ProfileView({ profile, isOwnProfile = false }: ProfileViewProps) {
  const [profileData, setProfileData] = useState<
    UserProfile & { is_verified?: boolean; phone_visible?: boolean; email_visible?: boolean }
  >(profile)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isSkillsLoading, setIsSkillsLoading] = useState(false)
  const [isExperienceLoading, setIsExperienceLoading] = useState(false)
  const [isEducationLoading, setIsEducationLoading] = useState(false)
  const [isCourseLoading, setIsCourseLoading] = useState(false)
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const [isSkillsEditOpen, setIsSkillsEditOpen] = useState(false)
  const [isExperienceOpen, setIsExperienceOpen] = useState(false)
  const [isEducationOpen, setIsEducationOpen] = useState(false)
  const [isCourseOpen, setIsCourseOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCurrentJob, setIsCurrentJob] = useState(false)
  const [isEducationComplete, setIsEducationComplete] = useState(true)
  const [isCourseComplete, setIsCourseComplete] = useState(true)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(profile.city_id || null)
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("")
  const [educationStatus, setEducationStatus] = useState("concluído")
  const [focusField, setFocusField] = useState<string | null>(null)
  const [isFirstJobLoading, setIsFirstJobLoading] = useState(false)

  const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000"}/profile/${profile.username}`

  const { showToast, ToastContainer } = useToast()

  // Verificar se deve mostrar botões de contato
  const shouldShowWhatsApp = isOwnProfile || profileData.phone_visible !== false
  const shouldShowEmail = isOwnProfile || profileData.email_visible !== false

  const handleWhatsAppContact = () => {
    if (profileData.whatsapp) {
      const message = `Olá ${profileData.full_name || profileData.username}, vi seu perfil na Nortão Empregos!`
      const whatsappUrl = `https://wa.me/${profileData.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    }
  }

  const handleShareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${profileData.full_name || profileData.username}`,
          text: profileData.professional_summary || "Confira meu perfil profissional",
          url: profileUrl,
        })
      } catch (error) {
        console.log("Erro ao compartilhar:", error)
      }
    } else {
      navigator.clipboard.writeText(profileUrl)
      alert("Link do perfil copiado!")
    }
  }

  const formatPeriod = (exp: Experience) => {
    if (!exp.startDate) return ""

    const startDate = new Date(exp.startDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

    if (exp.isCurrentJob) {
      return `${startDate} - Atual`
    }

    if (exp.endDate) {
      const endDate = new Date(exp.endDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
      return `${startDate} - ${endDate}`
    }

    return startDate
  }

  const handleProfileSubmit = async (formData: FormData) => {
    setIsProfileLoading(true)
    try {
      // Comprimir avatar se foi enviado
      const avatarFile = formData.get("avatar") as File
      if (avatarFile && avatarFile.size > 0) {
        const compressedAvatar = await compressImage(avatarFile, 400)
        formData.set("avatar", compressedAvatar)
      }

      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      await updateProfile(formData)

      // Atualização otimista do estado local
      const fullName = formData.get("fullName") as string
      const birthDate = formData.get("birthDate") as string
      const address = formData.get("address") as string
      const whatsapp = formData.get("whatsapp") as string
      const email = formData.get("email") as string
      const professionalSummary = formData.get("professionalSummary") as string
      const cnhTypes = formData.getAll("cnhTypes") as string[]

      setProfileData((prev) => ({
        ...prev,
        full_name: fullName,
        birth_date: birthDate,
        address: address,
        whatsapp,
        email,
        professional_summary: professionalSummary,
        cnh_types: cnhTypes,
        city_id: selectedCityId,
      }))

      setIsProfileEditOpen(false)
      showToast("Perfil atualizado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      showToast("Erro ao atualizar perfil. Tente novamente.", "error")
    } finally {
      setIsProfileLoading(false)
    }
  }

  const handleSkillsSubmit = async (formData: FormData) => {
    setIsSkillsLoading(true)
    try {
      await updateSkills(formData)

      // Atualização otimista
      const skills = formData.get("skills") as string
      const skillsArray = skills
        ? skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean)
        : []

      setProfileData((prev) => ({
        ...prev,
        skills: skillsArray,
      }))

      setIsSkillsEditOpen(false)
      showToast("Habilidades atualizadas com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao atualizar habilidades:", error)
      showToast("Erro ao atualizar habilidades. Tente novamente.", "error")
    } finally {
      setIsSkillsLoading(false)
    }
  }

  const handleFirstJobChange = async (checked: boolean) => {
    setIsFirstJobLoading(true)
    try {
      await updateFirstJobStatus(checked)

      // Atualização otimista
      setProfileData((prev) => ({
        ...prev,
        is_first_job: checked,
      }))

      showToast(checked ? "Status de primeiro emprego ativado!" : "Status de primeiro emprego desativado!", "success")
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showToast("Erro ao atualizar status. Tente novamente.", "error")
    } finally {
      setIsFirstJobLoading(false)
    }
  }

  const handleExperienceSubmit = async (formData: FormData) => {
    setIsExperienceLoading(true)
    try {
      formData.append("isCurrentJob", isCurrentJob.toString())
      await addExperience(formData)

      // Atualização otimista
      const position = formData.get("position") as string
      const company = formData.get("company") as string
      const startDate = formData.get("startDate") as string
      const endDate = formData.get("endDate") as string
      const activities = formData.get("activities") as string

      const newExperience = {
        position,
        company: company || undefined,
        startDate: startDate || undefined,
        endDate: isCurrentJob ? undefined : endDate || undefined,
        isCurrentJob,
        activities: activities || undefined,
      }

      setProfileData((prev) => ({
        ...prev,
        experiences: [...(prev.experiences || []), newExperience],
        is_first_job: false, // Desmarcar primeiro emprego automaticamente
      }))

      setIsExperienceOpen(false)
      setIsCurrentJob(false)
      showToast("Experiência adicionada com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao adicionar experiência:", error)
      showToast("Erro ao adicionar experiência. Tente novamente.", "error")
    } finally {
      setIsExperienceLoading(false)
    }
  }

  const handleEducationSubmit = async (formData: FormData) => {
    setIsEducationLoading(true)
    try {
      const status = formData.get("status") as string
      formData.append("status", status)
      await addEducation(formData)

      // Atualização otimista
      const level = formData.get("level") as string
      const institution = formData.get("institution") as string
      const completionYear = formData.get("completionYear") as string
      const courseName = formData.get("courseName") as string

      const newEducation = {
        level,
        institution,
        completionYear: status === "concluído" ? completionYear || undefined : undefined,
        isComplete: status === "concluído", // Mantém compatibilidade
        status,
        courseName: courseName || undefined,
      }

      setProfileData((prev) => ({
        ...prev,
        education: [...(prev.education || []), newEducation],
      }))

      setIsEducationOpen(false)
      setEducationStatus("concluído")
      setSelectedEducationLevel("")
      showToast("Formação adicionada com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao adicionar formação:", error)
      showToast("Erro ao adicionar formação. Tente novamente.", "error")
    } finally {
      setIsEducationLoading(false)
    }
  }

  const handleCourseSubmit = async (formData: FormData) => {
    setIsCourseLoading(true)
    try {
      formData.append("isComplete", isCourseComplete.toString())
      await addCourse(formData)

      // Atualização otimista
      const name = formData.get("name") as string
      const institution = formData.get("institution") as string
      const completionYear = formData.get("completionYear") as string
      const duration = formData.get("duration") as string

      const newCourse = {
        name: name.trim(),
        institution: institution.trim(),
        completionYear: completionYear?.trim() || undefined,
        duration: duration?.trim() || undefined,
        isComplete: isCourseComplete,
      }

      setProfileData((prev) => ({
        ...prev,
        courses: [...(prev.courses || []), newCourse],
      }))

      setIsCourseOpen(false)
      setIsCourseComplete(true)
      showToast("Curso adicionado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao adicionar curso:", error)
      showToast("Erro ao adicionar curso. Tente novamente.", "error")
    } finally {
      setIsCourseLoading(false)
    }
  }

  const handleRemoveExperience = async (index: number) => {
    try {
      await removeExperience(index)

      // Atualização otimista
      setProfileData((prev) => ({
        ...prev,
        experiences: (prev.experiences || []).filter((_, i) => i !== index),
      }))
      showToast("Experiência removida com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao remover experiência:", error)
      showToast("Erro ao remover experiência. Tente novamente.", "error")
    }
  }

  const handleRemoveEducation = async (index: number) => {
    try {
      await removeEducation(index)

      // Atualização otimista
      setProfileData((prev) => ({
        ...prev,
        education: (prev.education || []).filter((_, i) => i !== index),
      }))
      showToast("Formação removida com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao remover formação:", error)
      showToast("Erro ao remover formação. Tente novamente.", "error")
    }
  }

  const handleRemoveCourse = async (index: number) => {
    try {
      await removeCourse(index)

      // Atualização otimista
      setProfileData((prev) => ({
        ...prev,
        courses: (prev.courses || []).filter((_, i) => i !== index),
      }))
      showToast("Curso removido com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao remover curso:", error)
      showToast("Erro ao remover curso. Tente novamente.", "error")
    }
  }

  const openProfileEditWithFocus = (field: string) => {
    setFocusField(field)
    setIsProfileEditOpen(true)
  }

  useEffect(() => {
    if (isProfileEditOpen && focusField) {
      const timer = setTimeout(() => {
        const element = document.getElementById(focusField)
        if (element) {
          element.focus()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isProfileEditOpen, focusField])

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Header do Perfil */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Perfil</CardTitle>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={() => setIsProfileEditOpen(true)} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} alt={profileData.full_name || ""} />
                <AvatarFallback className="text-2xl">
                  {(profileData.full_name || profileData.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Selo de Verificação */}
              {profileData.is_verified && (
                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                {profileData.full_name ? (
                  <h1 className="text-2xl font-bold">{profileData.full_name}</h1>
                ) : (
                  isOwnProfile && (
                    <button
                      onClick={() => openProfileEditWithFocus("fullName")}
                      className="text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-gray-400 transition-colors"
                    >
                      <span className="text-lg">+ Adicionar nome completo</span>
                    </button>
                  )
                )}
                {profileData.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>

              {/* Idade */}
              {profileData.birth_date && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                  <Cake className="w-4 h-4" />
                  <span className="text-sm">{calculateAge(profileData.birth_date)} anos</span>
                </div>
              )}

              {/* Cidade */}
              {profileData.city_id ? (
                <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <CityDisplay
                    cityId={profileData.city_id}
                    fallback={`${profileData.city || ""}${profileData.city && profileData.state ? ", " : ""}${profileData.state || ""}`}
                  />
                </div>
              ) : (
                isOwnProfile && (
                  <button
                    onClick={() => openProfileEditWithFocus("cityId")}
                    className="flex items-center justify-center gap-1 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg p-2 mt-1 hover:border-gray-400 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">+ Adicionar cidade</span>
                  </button>
                )
              )}

              {/* Endereço */}
              {profileData.address && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                  <Home className="w-4 h-4" />
                  <span className="text-sm">{profileData.address}</span>
                </div>
              )}
            </div>

            {profileData.professional_summary ? (
              <p className="text-sm text-muted-foreground">{profileData.professional_summary}</p>
            ) : (
              isOwnProfile && (
                <button
                  onClick={() => openProfileEditWithFocus("professionalSummary")}
                  className="text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg p-3 w-full hover:border-gray-400 transition-colors"
                >
                  <span className="text-sm">
                    +{" "}
                    {profileData.user_type === "recruiter"
                      ? "Adicione a descrição da sua empresa"
                      : "Adicione um resumo profissional"}
                  </span>
                </button>
              )
            )}

            {/* CNH */}
            {profileData.cnh_types && profileData.cnh_types.length > 0 && (
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span className="text-sm">CNH: {profileData.cnh_types.join(", ")}</span>
              </div>
            )}

            {/* Placeholder para WhatsApp quando vazio */}
            {!profileData.whatsapp && isOwnProfile && (
              <button
                onClick={() => openProfileEditWithFocus("whatsapp")}
                className="flex items-center gap-2 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg p-3 w-full hover:border-gray-400 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">+ Adicionar WhatsApp</span>
              </button>
            )}

            {/* Placeholder para Email quando vazio */}
            {!profileData.email && isOwnProfile && (
              <button
                onClick={() => openProfileEditWithFocus("email")}
                className="flex items-center gap-2 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg p-3 w-full hover:border-gray-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">+ Adicionar Email</span>
              </button>
            )}

            {/* Botões de Contato - Condicionais baseados na visibilidade */}
            {(shouldShowWhatsApp || shouldShowEmail) && (
              <div className="flex gap-2 w-full">
                {shouldShowWhatsApp && profileData.whatsapp && (
                  <Button onClick={handleWhatsAppContact} className="flex-1" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                {shouldShowEmail && profileData.email && (
                  <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                    <a href={`mailto:${profileData.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-2 w-full">
              <Button variant="outline" size="sm" onClick={handleShareProfile} className="flex-1 bg-transparent">
                <Share2 className="w-4 h-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Habilidades */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Habilidades</CardTitle>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={() => setIsSkillsEditOpen(true)} className="h-8 w-8 p-0">
              <Edit className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {profileData.skills && profileData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            isOwnProfile && (
              <p className="text-muted-foreground text-center py-2">Adicione suas habilidades para se destacar</p>
            )
          )}
        </CardContent>
      </Card>

      {/* Experiências */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Experiência Profissional
          </CardTitle>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={() => setIsExperienceOpen(true)} className="h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Checkbox de Primeiro Emprego - só aparece se não tem experiências */}
          {isOwnProfile && (!profileData.experiences || profileData.experiences.length === 0) && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="firstJob"
                  checked={profileData.is_first_job || false}
                  onCheckedChange={handleFirstJobChange}
                  disabled={isFirstJobLoading}
                />
                <Label htmlFor="firstJob" className="text-sm font-medium">
                  Primeiro Emprego
                </Label>
                {isFirstJobLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Marque esta opção se você está em busca da sua primeira oportunidade profissional
              </p>
            </div>
          )}

          {/* Etiqueta de Primeiro Emprego */}
          {profileData.is_first_job && (!profileData.experiences || profileData.experiences.length === 0) && (
            <div className="mb-4">
              <div className="border-l-2 border-blue-200 pl-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Primeiro Emprego
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Candidato em busca da primeira oportunidade profissional
                </p>
              </div>
            </div>
          )}

          {/* Lista de Experiências */}
          {profileData.experiences && profileData.experiences.length > 0 ? (
            <div className="space-y-4">
              {(profileData.experiences as Experience[]).map((exp, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4 relative">
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExperience(index)}
                      className="absolute -right-2 -top-2 h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  <h3 className="font-semibold">{exp.position}</h3>
                  {exp.company && <p className="text-sm text-muted-foreground">{exp.company}</p>}
                  {(exp.startDate || exp.endDate) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatPeriod(exp)}
                    </p>
                  )}
                  {exp.activities && <p className="text-sm mt-2">{exp.activities}</p>}
                </div>
              ))}
            </div>
          ) : (
            !profileData.is_first_job &&
            isOwnProfile && (
              <p className="text-muted-foreground text-center py-2">Adicione suas experiências profissionais</p>
            )
          )}
        </CardContent>
      </Card>

      {/* Formação */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Formação
          </CardTitle>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={() => setIsEducationOpen(true)} className="h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {profileData.education && profileData.education.length > 0 ? (
            <div className="space-y-3">
              {(profileData.education as Education[]).map((edu, index) => (
                <div key={index} className="border-l-2 border-green-200 pl-4 relative">
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEducation(index)}
                      className="absolute -right-2 -top-2 h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  {/* Lógica de exibição baseada no nível */}
                  {edu.level === "Ensino Fundamental" || edu.level === "Ensino Médio" ? (
                    <>
                      <h3 className="font-semibold">{edu.level}</h3>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        {edu.status || "concluído"}
                        {(edu.status === "concluído" || !edu.status) &&
                          edu.completionYear &&
                          ` em ${edu.completionYear}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold">{edu.courseName || edu.level}</h3>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      <p className="text-sm text-muted-foreground">
                        {edu.status || "concluído"}
                        {(edu.status === "concluído" || !edu.status) &&
                          edu.completionYear &&
                          ` em ${edu.completionYear}`}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            isOwnProfile && <p className="text-muted-foreground text-center py-2">Adicione sua formação acadêmica</p>
          )}
        </CardContent>
      </Card>

      {/* Cursos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5" />
            Cursos
          </CardTitle>
          {isOwnProfile && (
            <Button variant="ghost" size="sm" onClick={() => setIsCourseOpen(true)} className="h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {profileData.courses && Array.isArray(profileData.courses) && profileData.courses.length > 0 ? (
            <div className="space-y-3">
              {(profileData.courses as Course[]).map((course, index) => (
                <div key={index} className="border-l-2 border-purple-200 pl-4 relative">
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCourse(index)}
                      className="absolute -right-2 -top-2 h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  <h3 className="font-semibold">{course.name}</h3>
                  <p className="text-sm text-muted-foreground">{course.institution}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{course.isComplete ? "Concluído" : "Em andamento"}</span>
                    {course.duration && <span>• {course.duration}</span>}
                    {course.completionYear && <span>• {course.completionYear}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            isOwnProfile && <p className="text-muted-foreground text-center py-2">Adicione cursos complementares</p>
          )}
        </CardContent>
      </Card>

      {/* Botão PDF (apenas para o próprio perfil) */}
      {isOwnProfile && (
        <div className="space-y-2">
          <ResumePDF profile={profileData} />
        </div>
      )}

      {/* Dialog para Editar Perfil */}
      <Dialog
        open={isProfileEditOpen}
        onOpenChange={(open) => {
          setIsProfileEditOpen(open)
          if (!open) setFocusField(null)
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>

          <form action={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="avatar">Foto de Perfil</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" />
              {profileData.avatar_url && (
                <p className="text-xs text-muted-foreground mt-1">Selecione uma nova imagem para substituir a atual</p>
              )}
            </div>

            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input id="fullName" name="fullName" defaultValue={profileData.full_name || ""} required />
            </div>

            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input id="birthDate" name="birthDate" type="date" defaultValue={profileData.birth_date || ""} />
            </div>

            <div>
              <Label htmlFor="cityId">Cidade</Label>
              <CitySelect
                value={selectedCityId}
                onValueChange={setSelectedCityId}
                placeholder="Selecione sua cidade"
                name="cityId"
                id="cityId"
              />
            </div>

            <div>
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                name="address"
                defaultValue={profileData.address || ""}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input id="whatsapp" name="whatsapp" defaultValue={profileData.whatsapp || ""} required />
            </div>

            <div>
              <Label htmlFor="professionalSummary">Resumo Profissional</Label>
              <Textarea
                id="professionalSummary"
                name="professionalSummary"
                defaultValue={profileData.professional_summary || ""}
                placeholder="Ex: Atendente com 2 anos de experiência..."
                rows={3}
              />
            </div>

            <div>
              <Label>CNH (Carteira de Habilitação)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CNH_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cnh-${type}`}
                      name="cnhTypes"
                      value={type}
                      defaultChecked={profileData.cnh_types?.includes(type)}
                    />
                    <Label htmlFor={`cnh-${type}`} className="text-sm">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isProfileLoading}>
              {isProfileLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Perfil"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Editar Habilidades */}
      <Dialog open={isSkillsEditOpen} onOpenChange={setIsSkillsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Habilidades</DialogTitle>
          </DialogHeader>

          <form action={handleSkillsSubmit} className="space-y-4">
            <div>
              <Label htmlFor="skills">Habilidades (separadas por vírgula)</Label>
              <Textarea
                id="skills"
                name="skills"
                defaultValue={profileData.skills?.join(", ") || ""}
                placeholder="Atendimento, Vendas, Excel, Moto própria, Comunicação, Trabalho em equipe"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separe cada habilidade por vírgula. Ex: Atendimento, Vendas, Excel
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSkillsLoading}>
              {isSkillsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Habilidades"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Experiência */}
      <Dialog open={isExperienceOpen} onOpenChange={setIsExperienceOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Experiência</DialogTitle>
          </DialogHeader>

          <form action={handleExperienceSubmit} className="space-y-4">
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input id="position" name="position" placeholder="Ex: Atendente" required />
            </div>

            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" name="company" placeholder="Nome da empresa" />
            </div>

            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="isCurrentJob" checked={isCurrentJob} onCheckedChange={setIsCurrentJob} />
              <Label htmlFor="isCurrentJob">Trabalho atual</Label>
            </div>

            {!isCurrentJob && (
              <div>
                <Label htmlFor="endDate">Data de Término</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
            )}

            <div>
              <Label htmlFor="activities">Atividades Desenvolvidas</Label>
              <Textarea
                id="activities"
                name="activities"
                placeholder="Descreva suas principais atividades e responsabilidades..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isExperienceLoading}>
              {isExperienceLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Experiência"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Formação */}
      <Dialog
        open={isEducationOpen}
        onOpenChange={(open) => {
          setIsEducationOpen(open)
          if (!open) {
            setSelectedEducationLevel("")
            setEducationStatus("concluído")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Formação</DialogTitle>
          </DialogHeader>

          <form action={handleEducationSubmit} className="space-y-4">
            <div>
              <Label htmlFor="level">Nível de Formação</Label>
              <Select name="level" required onValueChange={setSelectedEducationLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEducationLevel &&
              selectedEducationLevel !== "Ensino Fundamental" &&
              selectedEducationLevel !== "Ensino Médio" && (
                <div>
                  <Label htmlFor="courseName">Nome do Curso</Label>
                  <Input id="courseName" name="courseName" placeholder="Ex: Administração, Enfermagem, etc." required />
                </div>
              )}

            <div>
              <Label htmlFor="institution">Instituição de Ensino</Label>
              <Input id="institution" name="institution" placeholder="Nome da escola/universidade" required />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" required onValueChange={setEducationStatus} defaultValue="concluído">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {educationStatus === "concluído" && (
              <div>
                <Label htmlFor="completionYear">Ano de Conclusão</Label>
                <Input
                  id="completionYear"
                  name="completionYear"
                  type="number"
                  placeholder="2023"
                  min="1950"
                  max="2030"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isEducationLoading}>
              {isEducationLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Formação"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar Curso */}
      <Dialog open={isCourseOpen} onOpenChange={setIsCourseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Curso</DialogTitle>
          </DialogHeader>

          <form action={handleCourseSubmit} className="space-y-4">
            <div>
              <Label htmlFor="courseName">Nome do Curso</Label>
              <Input id="courseName" name="name" placeholder="Ex: Informática Básica" required />
            </div>

            <div>
              <Label htmlFor="courseInstitution">Instituição</Label>
              <Input id="courseInstitution" name="institution" placeholder="Nome da instituição" required />
            </div>

            <div>
              <Label htmlFor="courseDuration">Duração</Label>
              <Input id="courseDuration" name="duration" placeholder="Ex: 40h, 6 meses" />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="isCourseComplete" checked={isCourseComplete} onCheckedChange={setIsCourseComplete} />
              <Label htmlFor="isCourseComplete">Concluído</Label>
            </div>

            {isCourseComplete && (
              <div>
                <Label htmlFor="courseCompletionYear">Ano de Conclusão</Label>
                <Input
                  id="courseCompletionYear"
                  name="completionYear"
                  type="number"
                  placeholder="2023"
                  min="1950"
                  max="2030"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isCourseLoading}>
              {isCourseLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Curso"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ToastContainer />
    </div>
  )
}
