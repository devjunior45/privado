"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Upload, X, ImageIcon } from "lucide-react"
import { createJobPost } from "@/app/actions/posts"
import { useRouter } from "next/navigation"
import { CitySelect } from "@/components/ui/city-select"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"
import { useSectors } from "@/hooks/use-sectors"
import { MultiSelect } from "@/components/ui/multi-select"
import { VerificationModal } from "@/components/jobs/verification-modal"
import { compressImage } from "@/utils/compress-image"

const DARK_COLORS = [
  { name: "Preto", value: "#1F2937", class: "bg-gray-800" },
  { name: "Azul Escuro", value: "#1E3A8A", class: "bg-blue-900" },
  { name: "Verde Escuro", value: "#064E3B", class: "bg-emerald-900" },
  { name: "Roxo Escuro", value: "#581C87", class: "bg-purple-900" },
  { name: "Vermelho Escuro", value: "#7F1D1D", class: "bg-red-900" },
  { name: "Índigo Escuro", value: "#312E81", class: "bg-indigo-900" },
]

interface CreateJobFormProps {
  isVerified: boolean
  canCreateJob: boolean
}

export function CreateJobForm({ isVerified, canCreateJob }: CreateJobFormProps) {
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
  const [showVerificationModal, setShowVerificationModal] = useState(false)
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
      const lineHeight = 24 // Aproximadamente 1.5rem
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

    console.log("[v0] Arquivo selecionado:", file.name, file.size)

    try {
      const compressedFile = await compressImage(file, 400)
      console.log("[v0] Imagem comprimida:", compressedFile.size)

      const reader = new FileReader()
      reader.onloadstart = () => {
        console.log("[v0] Iniciando leitura do arquivo...")
      }
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log("[v0] Preview carregado, tamanho:", result?.length)
        setImagePreview(result)
        setSelectedImage(compressedFile)
      }
      reader.onerror = (error) => {
        console.error("[v0] Erro ao ler arquivo:", error)
      }
      reader.readAsDataURL(compressedFile)
    } catch (error) {
      console.error("[v0] Erro ao comprimir imagem:", error)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log("[v0] Preview (original) carregado")
        setImagePreview(result)
        setSelectedImage(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}
    if (!title.trim()) newErrors.title = "O título da vaga é obrigatório."
    if (!selectedCityId) newErrors.cityId = "A localização é obrigatória."
    if (selectedSectors.length === 0) newErrors.sectors = "Selecione pelo menos um setor."
    return newErrors
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!canCreateJob) {
      setShowVerificationModal(true)
      return
    }

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
                      <p className="text-xs text-muted-foreground">PNG, JPG até 5MB - Torna sua vaga mais atrativa</p>
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
                      onClick={removeImage}
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
              <CardTitle className="text-base">Informações da Vaga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-sm">
                    Título da Vaga *
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
                    Salário (Opcional)
                  </Label>
                  <Input
                    id="salary"
                    name="salary"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="Ex: R$ 5.000 - R$ 8.000"
                    className="text-base h-9"
                  />
                </div>

                <div>
                  <Label htmlFor="cityId" className="text-sm">
                    Localização *
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
              <CardTitle className="text-base">Descrição da Vaga</CardTitle>
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
                  placeholder="Descreva a vaga, responsabilidades, requisitos e benefícios..."
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
                  <strong>Dica de Formatação:</strong>
                </p>
                <p>
                  • Use <code>**texto**</code> para negrito
                </p>
                <p>• Use emojis para destacar seções (📋 🎯 🎁)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações de Candidatura</CardTitle>
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

          {!selectedImage && (
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
                        className={`
                        relative w-8 h-8 rounded-full border-2 transition-all
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
                            <div className="w-2 h-2 bg-white rounded-full" />
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
      </div>

      <VerificationModal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)} />
      <ToastContainer />
    </>
  )
}
