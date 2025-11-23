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
import { ChevronRight, Loader2 } from "lucide-react"

const TOTAL_STEPS = 9

const EDUCATION_LEVELS = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Técnico",
  "Ensino Superior",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
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

  // Estados dos formulários
  const [fullName, setFullName] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [cityId, setCityId] = useState<number | null>(null)
  const [birthDate, setBirthDate] = useState("")
  const [educationLevel, setEducationLevel] = useState("")
  const [educationInstitution, setEducationInstitution] = useState("")
  const [educationYear, setEducationYear] = useState("")
  const [hasExperience, setHasExperience] = useState<"yes" | "no" | null>(null)
  const [expPosition, setExpPosition] = useState("")
  const [expCompany, setExpCompany] = useState("")
  const [expStartDate, setExpStartDate] = useState("")
  const [expEndDate, setExpEndDate] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [cnhTypes, setCnhTypes] = useState<string[]>([])
  const [summary, setSummary] = useState("")
  const [address, setAddress] = useState("")

  const { cities, loading: citiesLoading } = useCities()

  const progress = (currentStep / TOTAL_STEPS) * 100

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
          if (!educationLevel) {
            alert("Por favor, selecione seu nível de escolaridade")
            setIsLoading(false)
            return
          }
          await saveOnboardingStep("education", {
            education: {
              level: educationLevel,
              institution: educationInstitution || "Não informado",
              completionYear: educationYear || undefined,
              isComplete: true,
              status: "concluído",
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
            if (!expPosition.trim()) {
              alert("Por favor, informe o cargo")
              setIsLoading(false)
              return
            }
            await saveOnboardingStep("experience", {
              is_first_job: false,
              experience: {
                position: expPosition,
                company: expCompany || undefined,
                startDate: expStartDate || undefined,
                endDate: expEndDate || undefined,
                isCurrentJob: false,
              },
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
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo *</Label>
                    <Input
                      id="position"
                      placeholder="Ex: Vendedor"
                      value={expPosition}
                      onChange={(e) => setExpPosition(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa (opcional)</Label>
                    <Input
                      id="company"
                      placeholder="Nome da empresa"
                      value={expCompany}
                      onChange={(e) => setExpCompany(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Início (opcional)</Label>
                      <Input
                        id="startDate"
                        type="month"
                        value={expStartDate}
                        onChange={(e) => setExpStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Fim (opcional)</Label>
                      <Input
                        id="endDate"
                        type="month"
                        value={expEndDate}
                        onChange={(e) => setExpEndDate(e.target.value)}
                      />
                    </div>
                  </div>
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
