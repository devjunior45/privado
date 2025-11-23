"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { saveOnboardingStep } from "@/app/actions/onboarding"
import { useCities } from "@/hooks/use-cities"
import { ChevronRight, Loader2, Plus, X } from "lucide-react"
import { StaggeredJobFeedSkeleton } from "@/components/ui/enhanced-job-skeleton"

const TOTAL_STEPS = 11

const EDUCATION_LEVELS = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Técnico",
  "Ensino Superior",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
]

const EDUCATION_STATUS = ["Cursando", "Incompleto", "Concluído"]

const SKILLS_OPTIONS = [
  "Atendimento ao cliente",
  "Vendas",
  "Comunicação",
  "Trabalho em equipe",
  "Liderança",
  "Organização",
  "Informática",
  "Idiomas",
  "Gestão de projetos",
  "Resolução de problemas",
  "Criatividade",
  "Negociação",
]

const CNH_OPTIONS = ["A", "B", "AB", "C", "D", "E"]

export function OnboardingQuiz() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Estados dos formulários
  const [whatsapp, setWhatsapp] = useState("")
  const [fullName, setFullName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [cityId, setCityId] = useState<number | null>(null)
  const [birthDate, setBirthDate] = useState("")
  const [educationLevel, setEducationLevel] = useState("")
  const [educationStatus, setEducationStatus] = useState("")
  const [courseName, setCourseName] = useState("")
  const [educationInstitution, setEducationInstitution] = useState("")
  const [educationYear, setEducationYear] = useState("")
  const [hasExperience, setHasExperience] = useState<"yes" | "no" | null>(null)
  const [experiences, setExperiences] = useState<
    Array<{
      position: string
      company: string
      startDate: string
      endDate: string
      isCurrentJob: boolean
      activities: string
    }>
  >([
    {
      position: "",
      company: "",
      startDate: "",
      endDate: "",
      isCurrentJob: false,
      activities: "",
    },
  ])
  const [skills, setSkills] = useState<string[]>([])
  const [cnhTypes, setCnhTypes] = useState<string[]>([])
  const [summary, setSummary] = useState("")
  const [address, setAddress] = useState("")
  const [courses, setCourses] = useState<
    Array<{
      name: string
      duration: string
      institution: string
      isComplete: boolean
      completionYear: string
    }>
  >([])
  const [hasCourses, setHasCourses] = useState<"yes" | "no" | null>(null)

  const { cities, loading: citiesLoading } = useCities()

  const progress = (currentStep / TOTAL_STEPS) * 100

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        position: "",
        company: "",
        startDate: "",
        endDate: "",
        isCurrentJob: false,
        activities: "",
      },
    ])
  }

  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((_, i) => i !== index))
    }
  }

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...experiences]
    updated[index] = { ...updated[index], [field]: value }
    setExperiences(updated)
  }

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        name: "",
        duration: "",
        institution: "",
        isComplete: false,
        completionYear: "",
      },
    ])
  }

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index))
  }

  const updateCourse = (index: number, field: string, value: any) => {
    const updated = [...courses]
    updated[index] = { ...updated[index], [field]: value }
    setCourses(updated)
  }

  const handleNext = async () => {
    setIsLoading(true)
    try {
      switch (currentStep) {
        case 1:
          if (!whatsapp.trim()) {
            alert("Por favor, informe seu número de WhatsApp")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("whatsapp", { whatsapp })
          break

        case 2:
          if (!fullName.trim()) {
            alert("Por favor, preencha seu nome completo")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("full_name", { full_name: fullName })
          break

        case 3:
          if (!city || !state) {
            alert("Por favor, selecione sua cidade")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("location", { city, state, city_id: cityId })
          break

        case 4:
          if (!birthDate) {
            alert("Por favor, informe sua data de nascimento")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("birth_date", { birth_date: birthDate })
          break

        case 5:
          if (!educationLevel || !educationStatus) {
            alert("Por favor, selecione o nível e status de escolaridade")
            setIsLoading(false)
            return
          }
          // Validar nome do curso se não for Ensino Fundamental/Médio
          if (!["Ensino Fundamental", "Ensino Médio"].includes(educationLevel) && !courseName.trim()) {
            alert("Por favor, informe o nome do curso")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("education", {
            education: {
              level: educationLevel,
              institution: educationInstitution || "Não informado",
              completionYear: educationYear || undefined,
              isComplete: educationStatus === "Concluído",
              status: educationStatus.toLowerCase() as "cursando" | "incompleto" | "concluído",
              courseName: courseName || undefined,
            },
          })
          break

        case 6:
          if (hasExperience === null) {
            alert("Por favor, informe se você já trabalhou antes")
            setIsLoading(false)
            return
          }
          if (hasExperience === "yes") {
            // Validar que pelo menos a primeira experiência tem cargo e empresa
            const firstExp = experiences[0]
            if (!firstExp.position.trim() || !firstExp.company.trim()) {
              alert("Por favor, informe o cargo e a empresa da primeira experiência")
              setIsLoading(false)
              return
            }
            // Filtrar experiências válidas (com cargo e empresa)
            const validExperiences = experiences.filter((exp) => exp.position.trim() && exp.company.trim())
            await saveOnboardingStep("experience", {
              is_first_job: false,
              experiences: validExperiences.map((exp) => ({
                position: exp.position,
                company: exp.company,
                startDate: exp.startDate || undefined,
                endDate: exp.isCurrentJob ? undefined : exp.endDate || undefined,
                isCurrentJob: exp.isCurrentJob,
                activities: exp.activities || undefined,
              })),
            })
          } else {
            await saveOnboardingStep("experience", { is_first_job: true })
          }
          break

        case 7:
          if (skills.length === 0) {
            alert("Por favor, selecione pelo menos uma habilidade")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("skills", { skills })
          break

        case 8:
          await saveOnboardingStep("cnh", { cnh_types: cnhTypes })
          break

        case 9:
          if (!summary.trim()) {
            alert("Por favor, conte um pouco sobre você")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("summary", { professional_summary: summary })
          break

        case 10:
          if (!address.trim()) {
            alert("Por favor, informe seu endereço")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("address", { address })
          break

        case 11:
          if (hasCourses === "yes") {
            // Validar cursos
            const validCourses = courses.filter((course) => course.name.trim() && course.institution.trim())
            if (validCourses.length === 0) {
              alert("Por favor, adicione pelo menos um curso ou selecione 'Não'")
              setIsLoading(false)
              return
            }
            await saveOnboardingStep("courses", { courses: validCourses })
          } else {
            await saveOnboardingStep("courses", { courses: [] })
          }
          // Último passo - redirecionar para o feed
          router.push("/feed")
          router.refresh()
          return
      }

      setCurrentStep((prev) => prev + 1)
    } catch (error) {
      console.error("Erro ao salvar passo:", error)
      alert("Erro ao salvar. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSkill = (skill: string) => {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]))
  }

  const toggleCNH = (type: string) => {
    setCnhTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  const requiresCourseName = (level: string) => {
    return !["Ensino Fundamental", "Ensino Médio"].includes(level)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Skeleton do feed no background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="max-w-md mx-auto pt-20">
          <StaggeredJobFeedSkeleton />
        </div>
      </div>

      {/* Overlay para destacar o card */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 to-indigo-100/90 backdrop-blur-sm" />

      <Card className="w-full max-w-2xl relative z-10 shadow-xl">
        <CardHeader>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Passo {currentStep} de {TOTAL_STEPS}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <CardTitle>Qual o seu número de contato/WhatsApp?</CardTitle>
              <CardDescription>Precisamos do seu contato para que as empresas possam entrar em contato</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <CardTitle>Qual é seu nome completo?</CardTitle>
              <CardDescription>Vamos começar conhecendo você</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  placeholder="Digite seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <CardTitle>Onde você mora?</CardTitle>
              <CardDescription>Isso ajuda a encontrar vagas próximas a você</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <select
                  id="city"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={cityId || ""}
                  onChange={(e) => {
                    const selectedCityId = Number(e.target.value)
                    const selectedCity = cities.find((c) => c.id === selectedCityId)
                    if (selectedCity) {
                      setCityId(selectedCity.id)
                      setCity(selectedCity.name)
                      setState(selectedCity.state)
                    }
                  }}
                  disabled={citiesLoading}
                >
                  <option value="">Selecione uma cidade</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - {c.state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <CardTitle>Qual é sua data de nascimento?</CardTitle>
              <CardDescription>Precisamos saber sua idade</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <CardTitle>Qual é seu nível de escolaridade?</CardTitle>
              <CardDescription>Informe sua formação acadêmica</CardDescription>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nível de escolaridade</Label>
                  <RadioGroup value={educationLevel} onValueChange={setEducationLevel}>
                    {EDUCATION_LEVELS.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <RadioGroupItem value={level} id={level} />
                        <Label htmlFor={level} className="font-normal cursor-pointer">
                          {level}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Status da formação */}
                {educationLevel && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <RadioGroup value={educationStatus} onValueChange={setEducationStatus}>
                      {EDUCATION_STATUS.map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <RadioGroupItem value={status} id={`status-${status}`} />
                          <Label htmlFor={`status-${status}`} className="font-normal cursor-pointer">
                            {status}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Nome do curso (se não for Fundamental/Médio) */}
                {educationLevel && requiresCourseName(educationLevel) && (
                  <div className="space-y-2">
                    <Label htmlFor="courseName">Nome do curso *</Label>
                    <Input
                      id="courseName"
                      placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="institution">Instituição (opcional)</Label>
                  <Input
                    id="institution"
                    placeholder="Nome da escola/universidade"
                    value={educationInstitution}
                    onChange={(e) => setEducationInstitution(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano de conclusão (opcional)</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2020"
                    value={educationYear}
                    onChange={(e) => setEducationYear(e.target.value)}
                    min="1950"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <CardTitle>Você já trabalhou antes?</CardTitle>
              <CardDescription>Conte sobre sua experiência profissional</CardDescription>
              <RadioGroup
                value={hasExperience || ""}
                onValueChange={(value) => setHasExperience(value as "yes" | "no")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="font-normal cursor-pointer">
                    Sim
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="font-normal cursor-pointer">
                    Não, é meu primeiro emprego
                  </Label>
                </div>
              </RadioGroup>

              {hasExperience === "yes" && (
                <div className="space-y-6 pt-4 max-h-96 overflow-y-auto">
                  {experiences.map((exp, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                      {experiences.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeExperience(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <p className="font-semibold text-sm">Experiência {index + 1}</p>
                      <div className="space-y-2">
                        <Label htmlFor={`position-${index}`}>Cargo *</Label>
                        <Input
                          id={`position-${index}`}
                          placeholder="Ex: Vendedor"
                          value={exp.position}
                          onChange={(e) => updateExperience(index, "position", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`company-${index}`}>Empresa *</Label>
                        <Input
                          id={`company-${index}`}
                          placeholder="Nome da empresa"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`activities-${index}`}>Atividades (opcional)</Label>
                        <Textarea
                          id={`activities-${index}`}
                          placeholder="Descreva suas atividades e responsabilidades"
                          value={exp.activities}
                          onChange={(e) => updateExperience(index, "activities", e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`startDate-${index}`}>Início (opcional)</Label>
                          <Input
                            id={`startDate-${index}`}
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                          />
                        </div>
                        {!exp.isCurrentJob && (
                          <div className="space-y-2">
                            <Label htmlFor={`endDate-${index}`}>Fim (opcional)</Label>
                            <Input
                              id={`endDate-${index}`}
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`currentJob-${index}`}
                          checked={exp.isCurrentJob}
                          onCheckedChange={(checked) => updateExperience(index, "isCurrentJob", checked)}
                        />
                        <Label htmlFor={`currentJob-${index}`} className="font-normal cursor-pointer">
                          Trabalho aqui atualmente
                        </Label>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={addExperience}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar outra experiência
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-4">
              <CardTitle>Quais habilidades você possui?</CardTitle>
              <CardDescription>Selecione todas que se aplicam</CardDescription>
              <div className="grid grid-cols-2 gap-3">
                {SKILLS_OPTIONS.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox id={skill} checked={skills.includes(skill)} onCheckedChange={() => toggleSkill(skill)} />
                    <Label htmlFor={skill} className="font-normal cursor-pointer text-sm">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 8 && (
            <div className="space-y-4">
              <CardTitle>Você possui CNH?</CardTitle>
              <CardDescription>Selecione as categorias que você possui (opcional)</CardDescription>
              <div className="grid grid-cols-3 gap-3">
                {CNH_OPTIONS.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox id={type} checked={cnhTypes.includes(type)} onCheckedChange={() => toggleCNH(type)} />
                    <Label htmlFor={type} className="font-normal cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Deixe em branco se não possui CNH</p>
            </div>
          )}

          {currentStep === 9 && (
            <div className="space-y-4">
              <CardTitle>Conte um pouco sobre você</CardTitle>
              <CardDescription>Compartilhe suas qualidades e objetivos profissionais</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="summary">Resumo profissional</Label>
                <Textarea
                  id="summary"
                  placeholder="Ex: Sou uma pessoa comunicativa, proativa e busco oportunidades na área de vendas..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}

          {currentStep === 10 && (
            <div className="space-y-4">
              <CardTitle>Qual seu endereço completo?</CardTitle>
              <CardDescription>Rua, número e bairro</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Ex: Rua das Flores, 123, Centro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 11 && (
            <div className="space-y-4">
              <CardTitle>Você possui cursos complementares?</CardTitle>
              <CardDescription>Cursos técnicos, profissionalizantes ou de aperfeiçoamento (opcional)</CardDescription>
              <RadioGroup
                value={hasCourses || ""}
                onValueChange={(value) => {
                  setHasCourses(value as "yes" | "no")
                  if (value === "yes" && courses.length === 0) {
                    addCourse()
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="courses-yes" />
                  <Label htmlFor="courses-yes" className="font-normal cursor-pointer">
                    Sim
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="courses-no" />
                  <Label htmlFor="courses-no" className="font-normal cursor-pointer">
                    Não
                  </Label>
                </div>
              </RadioGroup>

              {hasCourses === "yes" && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {courses.map((course, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeCourse(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="font-semibold text-sm">Curso {index + 1}</p>
                      <div className="space-y-2">
                        <Label htmlFor={`course-name-${index}`}>Nome do curso *</Label>
                        <Input
                          id={`course-name-${index}`}
                          placeholder="Ex: Técnicas de Vendas"
                          value={course.name}
                          onChange={(e) => updateCourse(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-institution-${index}`}>Instituição *</Label>
                        <Input
                          id={`course-institution-${index}`}
                          placeholder="Ex: SENAC"
                          value={course.institution}
                          onChange={(e) => updateCourse(index, "institution", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-duration-${index}`}>Duração (opcional)</Label>
                        <Input
                          id={`course-duration-${index}`}
                          placeholder="Ex: 40 horas"
                          value={course.duration}
                          onChange={(e) => updateCourse(index, "duration", e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`course-complete-${index}`}
                          checked={course.isComplete}
                          onCheckedChange={(checked) => updateCourse(index, "isComplete", checked)}
                        />
                        <Label htmlFor={`course-complete-${index}`} className="font-normal cursor-pointer">
                          Curso concluído
                        </Label>
                      </div>
                      {course.isComplete && (
                        <div className="space-y-2">
                          <Label htmlFor={`course-year-${index}`}>Ano de conclusão (opcional)</Label>
                          <Input
                            id={`course-year-${index}`}
                            type="number"
                            placeholder="2023"
                            value={course.completionYear}
                            onChange={(e) => updateCourse(index, "completionYear", e.target.value)}
                            min="1950"
                            max={new Date().getFullYear()}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="w-full bg-transparent" onClick={addCourse}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar outro curso
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleNext} className="w-full" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : currentStep === TOTAL_STEPS ? (
              "Finalizar"
            ) : (
              <>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
