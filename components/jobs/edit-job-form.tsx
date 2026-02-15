"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"
import { updateJobPost } from "@/app/actions/posts"
import { useRouter } from "next/navigation"
import { CitySelect } from "@/components/ui/city-select"
import { useToast } from "@/components/ui/toast"
import { useSectors } from "@/hooks/use-sectors"
import { MultiSelect } from "@/components/ui/multi-select"
import { compressImage } from "@/utils/compress-image"

const DARK_COLORS = [
  { name: "Preto", value: "#1F2937", class: "bg-gray-800" },
  { name: "Azul Escuro", value: "#1E3A8A", class: "bg-blue-900" },
  { name: "Verde Escuro", value: "#064E3B", class: "bg-emerald-900" },
  { name: "Roxo Escuro", value: "#581C87", class: "bg-purple-900" },
  { name: "Vermelho Escuro", value: "#7F1D1D", class: "bg-red-900" },
  { name: "Indigo Escuro", value: "#312E81", class: "bg-indigo-900" },
]

interface JobPost {
  id: string
  title: string
  company: string
  location: string
  city_id: number | null
  salary: string | null
  description: string
  image_url: string | null
  background_color: string | null
  allow_platform_applications: boolean
  sector_ids: number[] | null
  status: string
}

interface EditJobFormProps {
  job: JobPost
}

export function EditJobForm({ job }: EditJobFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(job.image_url)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(job.image_url)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(job.city_id)
  const [selectedColor, setSelectedColor] = useState(job.background_color || DARK_COLORS[0].value)
  const [title, setTitle] = useState(job.title)
  const [companyName, setCompanyName] = useState(job.company)
  const [salary, setSalary] = useState(job.salary || "")
  const [description, setDescription] = useState(job.description || "")
  const [allowPlatformApplications, setAllowPlatformApplications] = useState(job.allow_platform_applications)
  const [selectedSectors, setSelectedSectors] = useState<string[]>(
    job.sector_ids?.map((id) => id.toString()) || []
  )
  const [removeImage, setRemoveImage] = useState(false)
  const [errors, setErrors] = useState<{
    title?: string
    cityId?: string
    sectors?: string
  }>({})
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()
  const { sectors, isLoading: isLoadingSectors } = useSectors()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`

      if (previewRef.current) {
        previewRef.current.style.height = textarea.style.height
      }
    }
  }

  const ensureCursorVisible = () => {
    const textarea = textareaRef.current
    if (textarea) {
      const cursorPosition = textarea.selectionStart
      const textBeforeCursor = textarea.value.substring(0, cursorPosition)
      const lines = textBeforeCursor.split("\n")
      const currentLine = lines.length
      const lineHeight = 24
      const cursorTop = (currentLine - 1) * lineHeight

      if (cursorTop < textarea.scrollTop) {
        textarea.scrollTop = cursorTop
      } else if (cursorTop > textarea.scrollTop + textarea.clientHeight - lineHeight) {
        textarea.scrollTop = cursorTop - textarea.clientHeight + lineHeight * 2
      }

      if (previewRef.current) {
        previewRef.current.scrollTop = textarea.scrollTop
      }
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [description])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const compressedFile = await compressImage(file, 400)

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setSelectedImage(compressedFile)
        setRemoveImage(false)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setSelectedImage(file)
        setRemoveImage(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}
    if (!title.trim()) newErrors.title = "O titulo da vaga e obrigatorio."
    if (!selectedCityId) newErrors.cityId = "A localizacao e obrigatoria."
    if (selectedSectors.length === 0) newErrors.sectors = "Selecione pelo menos um setor."
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
    } else if (currentImageUrl && !removeImage) {
      formData.append("currentImageUrl", currentImageUrl)
    }

    if (removeImage) {
      formData.append("removeImage", "true")
    }

    if (!selectedImage && !currentImageUrl) {
      formData.append("postColor", selectedColor)
    }

    try {
      await updateJobPost(job.id, formData)
      showToast("Vaga atualizada com sucesso!", "success")
      router.push("/dashboard")
    } catch (error) {
      console.error("Erro ao atualizar vaga:", error)
      showToast(error instanceof Error ? error.message : "Erro inesperado ao atualizar vaga", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const renderFormattedText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value)
    setTimeout(() => {
      adjustTextareaHeight()
      ensureCursorVisible()
    }, 0)
  }

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (previewRef.current) {
      previewRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  const sectorOptions = sectors.map((s) => ({ value: s.id.toString(), label: s.name }))

  return (
    <>
      <div className="space-y-6 pb-20">
        <form onSubmit={handleFormSubmit} noValidate>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="w-5 h-5" />
                Imagem da Vaga (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <div className="space-y-2">
                      <Label htmlFor="image" className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
                          <Upload className="w-4 h-4" />
                          Escolher Imagem
                        </div>
                      </Label>
                      <Input
                        ref={fileInputRef}
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">PNG, JPG ate 5MB - Torna sua vaga mais atrativa</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview da vaga"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacoes da Vaga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-sm">
                    Titulo da Vaga *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }))
                    }}
                    placeholder="Ex: Desenvolvedor Frontend"
                    className="text-base h-9"
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <Label htmlFor="company" className="text-sm">
                    Nome da Empresa
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nome da empresa"
                    className="text-base h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary" className="text-sm">
                    Salario (Opcional)
                  </Label>
                  <Input
                    id="salary"
                    name="salary"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="Ex: R$ 5.000 - R$ 8.000"
                    className="text-base h-9"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setSalary("Salario a combinar")}
                      className="text-xs px-3 py-1 rounded-full border border-border hover:bg-accent transition-colors"
                    >
                      Salario a combinar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalary("Salario base mais beneficios")}
                      className="text-xs px-3 py-1 rounded-full border border-border hover:bg-accent transition-colors"
                    >
                      Salario base mais beneficios
                    </button>
                    <button
                      type="button"
                      onClick={() => setSalary("A combinar na entrevista")}
                      className="text-xs px-3 py-1 rounded-full border border-border hover:bg-accent transition-colors"
                    >
                      A combinar na entrevista
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cityId" className="text-sm">
                    Localizacao *
                  </Label>
                  <CitySelect
                    value={selectedCityId}
                    onValueChange={(value) => {
                      setSelectedCityId(value)
                      if (errors.cityId) setErrors((prev) => ({ ...prev, cityId: undefined }))
                    }}
                    placeholder="Selecione a cidade da vaga"
                    name="cityId"
                  />
                  {errors.cityId && <p className="text-xs text-red-500 mt-1">{errors.cityId}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="sectors" className="text-sm">
                  Setor(es) *
                </Label>
                <MultiSelect
                  options={sectorOptions}
                  selected={selectedSectors}
                  onChange={(value) => {
                    setSelectedSectors(value)
                    if (errors.sectors) setErrors((prev) => ({ ...prev, sectors: undefined }))
                  }}
                  placeholder={isLoadingSectors ? "Carregando..." : "Selecione um ou mais setores"}
                />
                {errors.sectors && <p className="text-xs text-red-500 mt-1">{errors.sectors}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Descricao da Vaga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  id="description"
                  name="description"
                  value={description}
                  onChange={handleDescriptionChange}
                  onScroll={handleScroll}
                  onKeyUp={ensureCursorVisible}
                  onClick={ensureCursorVisible}
                  placeholder="Descreva a vaga, responsabilidades, requisitos e beneficios..."
                  className="w-full px-3 py-2 border border-input rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono bg-white dark:bg-black text-black dark:text-white overflow-y-auto relative z-10"
                  style={{
                    minHeight: "200px",
                    lineHeight: "1.5rem",
                    caretColor: "currentColor",
                  }}
                />

                {description && (
                  <div
                    ref={previewRef}
                    className="absolute top-0 left-0 w-full h-full px-3 py-2 pointer-events-none text-sm overflow-y-auto bg-white dark:bg-black text-black dark:text-white rounded-md z-0"
                    style={{
                      minHeight: "200px",
                      lineHeight: "1.5rem",
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

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Dica de Formatacao:</strong>
                </p>
                <p>
                  Use <code>**texto**</code> para negrito
                </p>
                <p>Use emojis para destacar secoes</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuracoes de Candidatura</CardTitle>
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
                    Candidatos poderao se candidatar diretamente pela plataforma usando seus perfis
                  </p>
                </div>
              </div>

              {allowPlatformApplications && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Beneficios das candidaturas pela plataforma:</p>
                      <ul className="space-y-0.5 text-xs">
                        <li>Receba candidaturas organizadas em um so lugar</li>
                        <li>Visualize perfis completos dos candidatos</li>
                        <li>Gerencie o processo seletivo de forma eficiente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!imagePreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cor de Fundo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Escolha uma cor para o fundo da vaga</p>
                  <div className="flex gap-2 flex-wrap">
                    {DARK_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${color.class} ${
                          selectedColor === color.value
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-transparent hover:border-muted-foreground/50"
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t md:relative md:border-0 md:p-0 md:mt-6 z-50">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alteracoes"
              )}
            </Button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </>
  )
}
