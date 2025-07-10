"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Upload, X, ImageIcon, Bold } from "lucide-react"
import { createJobPost } from "@/app/actions/posts"
import { useRouter } from "next/navigation"
import { CitySelect } from "@/components/ui/city-select"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { useSectors } from "@/hooks/use-sectors"
import { MultiSelect } from "@/components/ui/multi-select"

const DARK_COLORS = [
  { name: "Preto", value: "#1F2937", class: "bg-gray-800" },
  { name: "Azul Escuro", value: "#1E3A8A", class: "bg-blue-900" },
  { name: "Verde Escuro", value: "#064E3B", class: "bg-emerald-900" },
  { name: "Roxo Escuro", value: "#581C87", class: "bg-purple-900" },
  { name: "Vermelho Escuro", value: "#7F1D1D", class: "bg-red-900" },
  { name: "Índigo Escuro", value: "#312E81", class: "bg-indigo-900" },
]

export function CreateJobForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState(DARK_COLORS[0].value)
  const [title, setTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [salary, setSalary] = useState("")
  const [description, setDescription] = useState("")
  const [allowPlatformApplications, setAllowPlatformApplications] = useState(true)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [errors, setErrors] = useState<{
    title?: string
    company?: string
    cityId?: string
    description?: string
    sectors?: string
  }>({})
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()
  const { sectors, isLoading: isLoadingSectors } = useSectors()

  // Buscar dados do perfil para preencher empresa
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, full_name")
          .eq("id", user.id)
          .single()

        if (profile) {
          setCompanyName(profile.company_name || profile.full_name || "")
        }
      }
    }

    fetchProfile()
  }, [])

  // Auto scroll para o final da página quando o conteúdo aumenta
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
    }, 100)
    return () => clearTimeout(timer)
  }, [description])

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

  // Função de formatação de texto simplificada
  const insertText = (before: string, after = "") => {
    const textarea = document.getElementById("description") as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = description.substring(start, end)
    const newText = description.substring(0, start) + before + selectedText + after + description.substring(end)
    setDescription(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}
    if (!title.trim()) newErrors.title = "O título da vaga é obrigatório."
    if (!companyName.trim()) newErrors.company = "O nome da empresa é obrigatório."
    if (!selectedCityId) newErrors.cityId = "A localização é obrigatória."
    if (selectedSectors.length === 0) newErrors.sectors = "Selecione pelo menos um setor."
    if (!selectedImage && !description.trim()) {
      newErrors.description = "A descrição é obrigatória se não houver imagem."
    }
    return newErrors
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    const formData = new FormData()
    formData.append("title", title)
    formData.append("company", companyName)
    formData.append("description", description)
    formData.append("allowPlatformApplications", allowPlatformApplications.toString())
    if (selectedCityId) formData.append("cityId", selectedCityId.toString())
    if (salary.trim()) formData.append("salary", salary)
    if (selectedSectors.length > 0) {
      formData.append("sector_ids", JSON.stringify(selectedSectors.map(Number)))
    }

    if (selectedImage) {
      formData.append("image", selectedImage)
    } else {
      formData.append("postColor", selectedColor)
    }

    try {
      await createJobPost(formData)
      showToast("Vaga publicada com sucesso!", "success")
      router.push("/dashboard")
    } catch (error) {
      console.error("Erro ao criar vaga:", error)
      showToast(error instanceof Error ? error.message : "Erro inesperado ao publicar vaga", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Função para renderizar o texto com formatação em tempo real
  const renderFormattedText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")
  }

  const sectorOptions = sectors.map((s) => ({ value: s.id.toString(), label: s.name }))

  return (
    <div className="space-y-6 pb-20">
      <form onSubmit={handleFormSubmit} noValidate>
        {/* Upload de Imagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Imagem da Vaga (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="image" className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="w-4 h-4" />
                        Escolher Imagem
                      </div>
                    </Label>
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <p className="text-sm text-muted-foreground">PNG, JPG até 5MB - Torna sua vaga mais atrativa</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview da vaga"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Vaga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Vaga</Label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
                }}
                placeholder="Ex: Desenvolvedor Frontend"
                className="text-lg font-medium"
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="company">Nome da Empresa</Label>
              <Input
                id="company"
                name="company"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value)
                  if (errors.company) setErrors((prev) => ({ ...prev, company: undefined }))
                }}
                placeholder="Nome da empresa"
              />
              {errors.company && <p className="text-sm text-red-500 mt-1">{errors.company}</p>}
            </div>

            <div>
              <Label htmlFor="salary">Salário (Opcional)</Label>
              <Input
                id="salary"
                name="salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Ex: R$ 5.000 - R$ 8.000"
              />
            </div>

            <div>
              <Label htmlFor="cityId">Localização</Label>
              <CitySelect
                value={selectedCityId}
                onValueChange={(value) => {
                  setSelectedCityId(value)
                  if (errors.cityId) setErrors((prev) => ({ ...prev, cityId: undefined }))
                }}
                placeholder="Selecione a cidade da vaga"
                name="cityId"
              />
              {errors.cityId && <p className="text-sm text-red-500 mt-1">{errors.cityId}</p>}
            </div>

            <div>
              <Label htmlFor="sectors">Setor(es) *</Label>
              <MultiSelect
                options={sectorOptions}
                selected={selectedSectors}
                onChange={(value) => {
                  setSelectedSectors(value)
                  if (errors.sectors) setErrors((prev) => ({ ...prev, sectors: undefined }))
                }}
                placeholder={isLoadingSectors ? "Carregando..." : "Selecione um ou mais setores"}
              />
              {errors.sectors && <p className="text-sm text-red-500 mt-1">{errors.sectors}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Descrição com Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição da Vaga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra de Ferramentas de Formatação Simplificada */}
            <div className="flex gap-2 p-2 bg-muted rounded-md">
              <Button type="button" variant="ghost" size="sm" onClick={() => insertText("**", "**")} title="Negrito">
                <Bold className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }))
                }}
                placeholder="Descreva a vaga, responsabilidades, requisitos e benefícios..."
                rows={16}
                className="w-full px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono bg-white dark:bg-black text-black dark:text-white"
                style={{
                  background: description ? "transparent" : undefined,
                  color: description ? "transparent" : undefined,
                }}
              />

              {/* Preview sobreposto */}
              {description && (
                <div
                  className="absolute top-0 left-0 w-full h-full px-3 py-2 pointer-events-none text-sm overflow-auto bg-white dark:bg-black text-black dark:text-white rounded-md"
                  style={{
                    minHeight: "16rem",
                    lineHeight: "1.5",
                  }}
                >
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{
                      __html: renderFormattedText(description),
                    }}
                  />
                </div>
              )}
            </div>

            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Dica de Formatação:</strong>
              </p>
              <p>
                • Use <code>**texto**</code> para negrito
              </p>
              <p>• Use emojis para destacar seções (📋 🎯 🎁)</p>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Candidatura */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Candidatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <Checkbox
                id="allowPlatformApplications"
                checked={allowPlatformApplications}
                onCheckedChange={(checked) => setAllowPlatformApplications(checked as boolean)}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="allowPlatformApplications"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Permitir candidaturas pela plataforma
                </Label>
                <p className="text-xs text-muted-foreground">
                  Candidatos poderão se candidatar diretamente pela plataforma usando seus perfis
                </p>
              </div>
            </div>

            {allowPlatformApplications && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Benefícios das candidaturas pela plataforma:</p>
                    <ul className="space-y-0.5 text-xs">
                      <li>• Receba candidaturas organizadas em um só lugar</li>
                      <li>• Visualize perfis completos dos candidatos</li>
                      <li>• Gerencie o processo seletivo de forma eficiente</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seletor de Cor - Só aparece se não houver imagem */}
        {!selectedImage && (
          <Card>
            <CardHeader>
              <CardTitle>Cor do Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Escolha uma cor escura para destacar sua vaga no feed</p>
                <div className="grid grid-cols-3 gap-3">
                  {DARK_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`
                        relative w-12 h-12 rounded-full border-2 transition-all mx-auto
                        ${
                          selectedColor === color.value
                            ? "border-primary ring-2 ring-primary/20 scale-110"
                            : "border-border hover:border-primary/50 hover:scale-105"
                        }
                        ${color.class}
                      `}
                    >
                      {selectedColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                      )}
                      <span className="sr-only">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de Publicar */}
        <div className="flex justify-center">
          <Button type="submit" disabled={isLoading} className="w-full max-w-md">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar Vaga"
            )}
          </Button>
        </div>
      </form>

      <ToastContainer />
    </div>
  )
}
