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

const EDUCATION_STATUS_OPTIONS = [
  { value: "concluído", label: "Concluído" },
  { value: "cursando", label: "Cursando" },
  { value: "incompleto", label: "Incompleto" },
]

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

  const [whatsapp, setWhatsapp] = useState("")
  const [fullName, setFullName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [cityId, setCityId] = useState<number | null>(null)
  const [birthDate, setBirthDate] = useState("")

  const [educationLevel, setEducationLevel] = useState("")
  const [educationStatus, setEducationStatus] = useState<"concluído" | "cursando" | "incompleto">("concluído")
  const [educationCourseName, setEducationCourseName] = useState("")
  const [educationInstitution, setEducationInstitution] = useState("")
  const [educationYear, setEducationYear] = useState("")

  const [hasExperience, setHasExperience] = useState<"yes" | "no" | null>(null)
  const [experiences, setExperiences] = useState([
    {
      position: "",
      company: "",
      activities: "",
      startDate: "",
      endDate: "",
      isCurrentJob: false,
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
      isComplete: boolean
      institution: string
      completionYear: string
    }>
  >([])
  const [hasMoreCourses, setHasMoreCourses] = useState(false)

  const { cities, loading: citiesLoading } = useCities()

  const progress = (currentStep / TOTAL_STEPS) * 100

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        position: "",
        company: "",
        activities: "",
        startDate: "",
        endDate: "",
        isCurrentJob: false,
      },
    ])
  }

  const removeExperience = (index: number) => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter((_, i) => i !== index))
    }
  }

  const updateExperience = (index: number, field: string, value: any) => {
    const newExperiences = [...experiences]
    newExperiences[index] = { ...newExperiences[index], [field]: value }
    setExperiences(newExperiences)
  }

  const addCourse = () => {
    setCourses([
      ...courses,
      {
        name: "",
        duration: "",
        isComplete: false,
        institution: "",
        completionYear: "",
      },
    ])
  }

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index))
  }

  const updateCourse = (index: number, field: string, value: any) => {
    const newCourses = [...courses]
    newCourses[index] = { ...newCourses[index], [field]: value }
    setCourses(newCourses)
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
          if (!educationLevel) {
            alert("Por favor, selecione seu nível de escolaridade")
            setIsLoading(false)
            return
          }
          if (!["Ensino Fundamental", "Ensino Médio"].includes(educationLevel) && !educationCourseName.trim()) {
            alert("Por favor, informe o nome do curso")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("education", {
            education: {
              level: educationLevel,
              institution: educationInstitution || "Não informado",
              completionYear: educationYear || undefined,
              isComplete: educationStatus === "concluído",
              status: educationStatus,
              courseName: educationCourseName || undefined,
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
            const validExperiences = experiences.filter((exp) => exp.position.trim() && exp.company.trim())
            if (validExperiences.length === 0) {
              alert("Por favor, preencha pelo menos uma experiência com cargo e empresa")
              setIsLoading(false)
              return
            }
            await saveOnboardingStep("experiences", {
              is_first_job: false,
              experiences: validExperiences.map((exp) => ({
                position: exp.position,
                company: exp.company,
                activities: exp.activities || undefined,
                startDate: exp.startDate || undefined,
                endDate: exp.isCurrentJob ? undefined : exp.endDate || undefined,
                isCurrentJob: exp.isCurrentJob,
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
          if (courses.length > 0) {
            const validCourses = courses.filter((course) => course.name.trim() && course.institution.trim())
            if (validCourses.length > 0) {
              await saveOnboardingStep("courses", {
                courses: validCourses.map((course) => ({
                  name: course.name,
                  duration: course.duration || undefined,
                  isComplete: course.isComplete,
                  institution: course.institution,
                  completionYear: course.isComplete ? course.completionYear || undefined : undefined,
                })),
              })
            }
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

  const shouldShowCourseName = educationLevel && !["Ensino Fundamental", "Ensino Médio"].includes(educationLevel)

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
          {currentStep === 1 && (
            <div className="space-y-4">
              <CardTitle>Qual o seu número de contato/WhatsApp?</CardTitle>
              <CardDescription>Precisamos de um contato para os recrutadores</CardDescription>
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

          {/* PASSO 2 - Nome completo */}
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

          {/* PASSO 3 - Localização */}
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

          {/* PASSO 4 - Data de nascimento */}
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

                {educationLevel && (
                  <>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <RadioGroup value={educationStatus} onValueChange={(value) => setEducationStatus(value as any)}>
                        {EDUCATION_STATUS_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value} className="font-normal cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {shouldShowCourseName && (
                      <div className="space-y-2">
                        <Label htmlFor="courseName">Nome do curso *</Label>
                        <Input
                          id="courseName"
                          placeholder="Ex: Engenharia Civil, Técnico em Informática"
                          value={educationCourseName}
                          onChange={(e) => setEducationCourseName(e.target.value)}
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

                    {educationStatus === "concluído" && (
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
                  </>
                )}
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
                <div className="space-y-6 pt-4">
                  {experiences.map((exp, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Experiência {index + 1}</h4>
                        {experiences.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

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

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`current-${index}`}
                          checked={exp.isCurrentJob}
                          onCheckedChange={(checked) => updateExperience(index, "isCurrentJob", checked)}
                        />
                        <Label htmlFor={`current-${index}`} className="font-normal cursor-pointer">
                          Trabalho aqui atualmente
                        </Label>
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
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addExperience} className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar mais experiência
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* PASSO 7 - Habilidades */}
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

          {/* PASSO 8 - CNH */}
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

          {/* PASSO 9 - Resumo profissional */}
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

          {/* PASSO 10 - Endereço */}
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
              <CardTitle>Deseja adicionar cursos?</CardTitle>
              <CardDescription>Adicione cursos complementares que você fez (opcional)</CardDescription>

              {courses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhum curso adicionado ainda</p>
                  <Button type="button" variant="outline" onClick={addCourse}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar curso
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {courses.map((course, index) => (
                    <div key={index} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Curso {index + 1}</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeCourse(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

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
                          placeholder="Ex: SENAC, Coursera"
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

                  <Button type="button" variant="outline" onClick={addCourse} className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar mais curso
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
