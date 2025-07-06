"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, X, Info, Building } from "lucide-react"
import { createJobPost } from "@/app/actions/posts"
import { useRouter } from "next/navigation"
import { CitySelect } from "@/components/ui/city-select"
import { useToast } from "@/components/ui/toast"

const JOB_TYPES = ["Tempo Integral", "Meio Período", "Contrato", "Temporário", "Estágio", "Freelancer", "Aprendiz"]

const EXPERIENCE_LEVELS = ["Sem experiência", "Até 1 ano", "1-3 anos", "3-5 anos", "5-10 anos", "Mais de 10 anos"]

const EDUCATION_LEVELS = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Técnico",
  "Ensino Superior",
  "Pós-graduação",
  "Mestrado",
  "Doutorado",
]

export function CreateJobForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [allowPlatformApplications, setAllowPlatformApplications] = useState(true)
  const [requirements, setRequirements] = useState<string[]>([])
  const [benefits, setBenefits] = useState<string[]>([])
  const [newRequirement, setNewRequirement] = useState("")
  const [newBenefit, setNewBenefit] = useState("")
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !requirements.includes(newRequirement.trim())) {
      setRequirements([...requirements, newRequirement.trim()])
      setNewRequirement("")
    }
  }

  const removeRequirement = (requirement: string) => {
    setRequirements(requirements.filter((r) => r !== requirement))
  }

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit("")
    }
  }

  const removeBenefit = (benefit: string) => {
    setBenefits(benefits.filter((b) => b !== benefit))
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      formData.append("allowPlatformApplications", allowPlatformApplications.toString())
      formData.append("requirements", JSON.stringify(requirements))
      formData.append("benefits", JSON.stringify(benefits))

      const result = await createJobPost(formData)

      if (result.success) {
        showToast("Vaga publicada com sucesso!", "success")
        router.push("/dashboard")
      } else {
        showToast(result.error || "Erro ao publicar vaga", "error")
      }
    } catch (error) {
      console.error("Erro ao criar vaga:", error)
      showToast("Erro inesperado ao publicar vaga", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Vaga *</Label>
              <Input id="title" name="title" placeholder="Ex: Atendente de Loja" required />
            </div>

            <div>
              <Label htmlFor="company">Nome da Empresa *</Label>
              <Input id="company" name="company" placeholder="Nome da sua empresa" required />
            </div>

            <div>
              <Label htmlFor="cityId">Localização *</Label>
              <CitySelect
                value={selectedCityId}
                onValueChange={setSelectedCityId}
                placeholder="Selecione a cidade da vaga"
                name="cityId"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobType">Tipo de Contrato</Label>
                <Select name="jobType">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salary">Salário</Label>
                <Input id="salary" name="salary" placeholder="Ex: R$ 1.500,00" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descrição */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição da Vaga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Descrição Completa *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descreva as responsabilidades, atividades e o que a pessoa fará no dia a dia..."
                rows={6}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Requisitos */}
        <Card>
          <CardHeader>
            <CardTitle>Requisitos e Qualificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experienceLevel">Nível de Experiência</Label>
                <Select name="experienceLevel">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="educationLevel">Escolaridade</Label>
                <Select name="educationLevel">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a escolaridade" />
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
            </div>

            {/* Requisitos Específicos */}
            <div>
              <Label>Requisitos Específicos</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Ex: CNH categoria B"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement} variant="outline">
                  Adicionar
                </Button>
              </div>
              {requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.map((req) => (
                    <Badge key={req} variant="secondary" className="flex items-center gap-1">
                      {req}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeRequirement(req)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle>Benefícios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Benefícios Oferecidos</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Ex: Vale transporte"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" onClick={addBenefit} variant="outline">
                  Adicionar
                </Button>
              </div>
              {benefits.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {benefits.map((benefit) => (
                    <Badge key={benefit} variant="secondary" className="flex items-center gap-1">
                      {benefit}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeBenefit(benefit)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Imagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Imagem da Vaga (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image">Adicionar Imagem</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione uma imagem atrativa para sua vaga (PNG, JPG até 5MB)
                </p>
              </div>

              {imagePreview && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Candidatura */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Candidatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowPlatformApplications"
                checked={allowPlatformApplications}
                onCheckedChange={setAllowPlatformApplications}
              />
              <Label htmlFor="allowPlatformApplications">Permitir candidaturas pela plataforma</Label>
            </div>

            {allowPlatformApplications && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Candidatos poderão se candidatar diretamente pela plataforma. Você receberá notificações e poderá
                  gerenciar as candidaturas no seu dashboard.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="applicationInstructions">Instruções para Candidatura</Label>
              <Textarea
                id="applicationInstructions"
                name="applicationInstructions"
                placeholder="Ex: Envie seu currículo para email@empresa.com ou candidate-se pela plataforma"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="contactEmail">Email para Contato (Opcional)</Label>
              <Input id="contactEmail" name="contactEmail" type="email" placeholder="contato@empresa.com" />
            </div>

            <div>
              <Label htmlFor="contactPhone">Telefone para Contato (Opcional)</Label>
              <Input id="contactPhone" name="contactPhone" placeholder="(11) 99999-9999" />
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar Vaga"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>

      <ToastContainer />
    </div>
  )
}
