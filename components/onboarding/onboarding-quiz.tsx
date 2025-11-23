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
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react"

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

interface Experience {
  position: string
  company: string
  startDate?: string
  endDate?: string
  activities: string
}

interface Course {
  name: string
  duration: string
  isComplete: boolean
  institution: string
  completionYear?: string
}

export function OnboardingQuiz() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Estados dos formulários
  const [fullName, setFullName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [cityId, setCityId] = useState<number | null>(null)
  const [birthDate, setBirthDate] = useState("")
  const [educationLevel, setEducationLevel] = useState("")
  const [educationStatus, setEducationStatus] = useState("")
  const [educationInstitution, setEducationInstitution] = useState("")
  const [educationYear, setEducationYear] = useState("")
  const [hasExperience, setHasExperience] = useState<"yes" | "no" | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([
    { position: "", company: "", startDate: "", endDate: "", activities: "" },
  ])
  const [skills, setSkills] = useState<string[]>([])
  const [cnhTypes, setCnhTypes] = useState<string[]>([])
  const [summary, setSummary] = useState("")
  const [address, setAddress] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [hasCourses, setHasCourses] = useState<"yes" | "no" | null>(null)
  const [courses, setCourses] = useState<Course[]>([
    { name: "", duration: "", isComplete: false, institution: "", completionYear: "" },
  ])

  const { cities, loading: citiesLoading } = useCities()

  const progress = (currentStep / TOTAL_STEPS) * 100

  const addExperience = () => {
    setExperiences([...experiences, { position: "", company: "", startDate: "", endDate: "", activities: "" }])
  }

  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((_, i) => i !== index))
    }
  }

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experiences]
    updated[index] = { ...updated[index], [field]: value }
    setExperiences(updated)
  }

  const addCourse = () => {
    setCourses([...courses, { name: "", duration: "", isComplete: false, institution: "", completionYear: "" }])
  }

  const removeCourse = (index: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index))
    }
  }

  const updateCourse = (index: number, field: keyof Course, value: string | boolean) => {
    const updated = [...courses]
    updated[index] = { ...updated[index], [field]: value }
    setCourses(updated)
  }

  const handleNext = async () => {
    setIsLoading(true)
    try {
      switch (currentStep) {
        case 1:
          if (!fullName.trim()) {
            alert("Por favor, preencha seu nome completo")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("full_name", { full_name: fullName })
          break

        case 2:
          if (!city || !state) {
            alert("Por favor, selecione sua cidade")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("location", { city, state, city_id: cityId })
          break

        case 3:
          if (!birthDate) {
            alert("Por favor, informe sua data de nascimento")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("birth_date", { birth_date: birthDate })
          break

        case 4:
          if (!educationLevel || !educationStatus) {
            alert("Por favor, selecione seu nível de escolaridade e status")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("education", {
            education: {
              level: educationLevel,
              institution: educationInstitution || "Não informado",
              completionYear: educationYear || undefined,
              isComplete: educationStatus === "Concluído",
              status: educationStatus.toLowerCase(),
            },
          })
          break

        case 5:
          if (hasExperience === null) {
            alert("Por favor, informe se você já trabalhou antes")
            setIsLoading(false)
            return
          }
          if (hasExperience === "yes") {
            const invalidExperience = experiences.find((exp) => !exp.position.trim() || !exp.company.trim())
            if (invalidExperience) {
              alert("Por favor, preencha o cargo e a empresa em todas as experiências")
              setIsLoading(false)
              return
            }
            await saveOnboardingStep("experience", {
              is_first_job: false,
              experiences: experiences,
            })
          } else {
            await saveOnboardingStep("experience", { is_first_job: true })
          }
          break

        case 6:
          if (skills.length === 0) {
            alert("Por favor, selecione pelo menos uma habilidade")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("skills", { skills })
          break

        case 7:
          await saveOnboardingStep("cnh", { cnh_types: cnhTypes })
          break

        case 8:
          if (!summary.trim()) {
            alert("Por favor, conte um pouco sobre você")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("summary", { professional_summary: summary })
          break

        case 9:
          if (!address.trim()) {
            alert("Por favor, informe seu endereço")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("address", { address })
          break

        case 10:
          if (!whatsapp.trim()) {
            alert("Por favor, informe seu WhatsApp")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("whatsapp", { whatsapp })
          break

        case 11:
          if (hasCourses === "yes") {
            const invalidCourse = courses.find(
              (course) => !course.name.trim() || !course.institution.trim() || !course.duration.trim(),
            )
            if (invalidCourse) {
              alert("Por favor, preencha nome, instituição e duração em todos os cursos")
              setIsLoading(false)
              return
            }
            // Validar completionYear se isComplete for true
            const incompleteCourse = courses.find((course) => course.isComplete && !course.completionYear)
            if (incompleteCourse) {
              alert("Por favor, informe o ano de conclusão para cursos concluídos")
              setIsLoading(false)
              return
            }
            await saveOnboardingStep("courses", { courses })
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Passo {currentStep} de {TOTAL_STEPS}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PASSO 1 - Nome completo */}
          {currentStep === 1 && (
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

          {/* PASSO 2 - Localização */}
          {currentStep === 2 && (
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

          {/* PASSO 3 - Data de nascimento */}
          {currentStep === 3 && (
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

          {/* PASSO 4 - Formação */}
          {currentStep === 4 && (
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
                <div className="space-y-2">
                  <Label>Status</Label>
                  <RadioGroup value={educationStatus} onValueChange={setEducationStatus}>
                    {EDUCATION_STATUS.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <RadioGroupItem value={status} id={status} />
                        <Label htmlFor={status} className="font-normal cursor-pointer">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution">Instituição (opcional)</Label>
                  <Input
                    id="institution"
                    placeholder="Nome da escola/universidade"
                    value={educationInstitution}
                    onChange={(e) => setEducationInstitution(e.target.value)}
                  />
                </div>
                {educationStatus === "Concluído" && (
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
                )}
              </div>
            </div>
          )}

          {/* PASSO 5 - Experiência */}
          {currentStep === 5 && (
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
                <div className="space-y-4 pt-4">
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
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <h4 className="font-medium">Experiência {index + 1}</h4>
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
                          placeholder="Descreva suas principais atividades..."
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
                        <div className="space-y-2">
                          <Label htmlFor={`endDate-${index}`}>Fim (opcional)</Label>
                          <Input
                            id={`endDate-${index}`}
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addExperience} className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar outra experiência
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* PASSO 6 - Habilidades */}
          {currentStep === 6 && (
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

          {/* PASSO 7 - CNH */}
          {currentStep === 7 && (
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

          {/* PASSO 8 - Resumo profissional */}
          {currentStep === 8 && (
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

          {/* PASSO 9 - Endereço */}
          {currentStep === 9 && (
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

          {currentStep === 10 && (
            <div className="space-y-4">
              <CardTitle>Qual seu WhatsApp?</CardTitle>
              <CardDescription>Para que as empresas possam entrar em contato</CardDescription>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 11 && (
            <div className="space-y-4">
              <CardTitle>Você possui cursos complementares?</CardTitle>
              <CardDescription>Certificações, workshops ou cursos que você realizou</CardDescription>
              <RadioGroup value={hasCourses || ""} onValueChange={(value) => setHasCourses(value as "yes" | "no")}>
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
                <div className="space-y-4 pt-4">
                  {courses.map((course, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                      {courses.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeCourse(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <h4 className="font-medium">Curso {index + 1}</h4>
                      <div className="space-y-2">
                        <Label htmlFor={`course-name-${index}`}>Nome do curso *</Label>
                        <Input
                          id={`course-name-${index}`}
                          placeholder="Ex: Excel Avançado"
                          value={course.name}
                          onChange={(e) => updateCourse(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-institution-${index}`}>Instituição *</Label>
                        <Input
                          id={`course-institution-${index}`}
                          placeholder="Nome da instituição"
                          value={course.institution}
                          onChange={(e) => updateCourse(index, "institution", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`course-duration-${index}`}>Duração *</Label>
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
                          onCheckedChange={(checked) => updateCourse(index, "isComplete", checked as boolean)}
                        />
                        <Label htmlFor={`course-complete-${index}`} className="font-normal cursor-pointer">
                          Curso concluído
                        </Label>
                      </div>
                      {course.isComplete && (
                        <div className="space-y-2">
                          <Label htmlFor={`course-year-${index}`}>Ano de conclusão *</Label>
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
                  <Button type="button" variant="outline" onClick={addCourse} className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
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
