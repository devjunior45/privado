"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, GraduationCap, Award, Calendar, Plus, Trash2, Loader2 } from "lucide-react"
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
} from "@/app/actions/profile"
import { CitySelect } from "@/components/ui/city-select"
import { useToast } from "@/components/ui/toast"

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
  const [isFirstJob, setIsFirstJob] = useState(profile.is_first_job || false)

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
      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      formData.append("isFirstJob", isFirstJob.toString())

      await updateProfile(formData)

      // Atualização otimista do estado local
      const fullName = formData.get("fullName") as string
      const whatsapp = formData.get("whatsapp") as string
      const email = formData.get("email") as string
      const professionalSummary = formData.get("professionalSummary") as string
      const cnhTypes = formData.getAll("cnhTypes") as string[]

      setProfileData((prev) => ({
        ...prev,
        full_name: fullName,
        whatsapp,
        email,
        professional_summary: professionalSummary,
        cnh_types: cnhTypes,
        city_id: selectedCityId,
        is_first_job: isFirstJob,
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
    <div>
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
          {/* Badge de Primeiro Emprego */}
          {profileData.is_first_job && (!profileData.experiences || profileData.experiences.length === 0) && (
            <div className="mb-4">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">Primeiro Emprego</Badge>
            </div>
          )}

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
            isOwnProfile &&
            !profileData.is_first_job && (
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
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={profileData.whatsapp || ""}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={profileData.email || ""} />
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

            {/* Checkbox Primeiro Emprego - só aparece se não tem experiências */}
            {(!profileData.experiences || profileData.experiences.length === 0) && (
              <div className="flex items-center space-x-2">
                <Checkbox id="isFirstJob" checked={isFirstJob} onCheckedChange={setIsFirstJob} />
                <Label htmlFor="isFirstJob" className="text-sm">
                  Primeiro Emprego
                </Label>
              </div>
            )}

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
