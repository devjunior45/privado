"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CitySelect } from "@/components/ui/city-select"
import { MultiSelect } from "@/components/ui/multi-select"
import { useSectors } from "@/hooks/use-sectors"
import { createJobPost } from "@/app/actions/posts"
import { Loader2, Upload, X } from "lucide-react"
import { VerificationRequiredDialog } from "./verification-required-dialog"

interface CreateJobFormProps {
  isVerified: boolean
  activeJobsCount: number
}

const backgroundColors = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Laranja", value: "#f97316" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Índigo", value: "#6366f1" },
  { name: "Amarelo", value: "#eab308" },
]

export function CreateJobForm({ isVerified, activeJobsCount }: CreateJobFormProps) {
  const router = useRouter()
  const { sectors, loading: loadingSectors } = useSectors()
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState(backgroundColors[0].value)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [allowPlatformApplications, setAllowPlatformApplications] = useState(true)
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Verificar limite de vagas para não verificados
    if (!isVerified && activeJobsCount >= 1) {
      setShowVerificationDialog(true)
      return
    }

    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("backgroundColor", selectedColor)
      formData.append("cityId", selectedCityId?.toString() || "")
      formData.append("sector_ids", JSON.stringify(selectedSectors))
      formData.append("allowPlatformApplications", allowPlatformApplications.toString())

      if (imageFile) {
        formData.append("image", imageFile)
      }

      await createJobPost(formData)
      router.push("/dashboard")
    } catch (error) {
      console.error("Erro ao criar vaga:", error)
      alert("Erro ao criar vaga. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Título e Empresa em grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm">
                  Título da Vaga
                </Label>
                <Input id="title" name="title" placeholder="Ex: Desenvolvedor Full Stack" required className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm">
                  Nome da Empresa
                </Label>
                <Input id="company" name="company" placeholder="Nome da sua empresa" required className="h-9" />
              </div>
            </div>

            {/* Salário e Localização em grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-sm">
                  Salário (opcional)
                </Label>
                <Input id="salary" name="salary" placeholder="Ex: R$ 5.000 - R$ 8.000" className="h-9" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm">
                  Localização
                </Label>
                <CitySelect value={selectedCityId} onChange={setSelectedCityId} required />
              </div>
            </div>

            {/* Setores */}
            <div className="space-y-2">
              <Label htmlFor="sectors" className="text-sm">
                Setores (opcional)
              </Label>
              <MultiSelect
                options={sectors.map((sector) => ({
                  value: sector.id.toString(),
                  label: sector.name,
                }))}
                selected={selectedSectors}
                onChange={setSelectedSectors}
                placeholder="Selecione os setores..."
                disabled={loadingSectors}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">
                Descrição da Vaga
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descreva as responsabilidades, requisitos e benefícios..."
                required
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Você pode usar **negrito** para destacar texto importante</p>
            </div>
          </CardContent>
        </Card>

        {/* Imagem da vaga */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="text-base font-semibold">Imagem da Vaga (opcional)</h3>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
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
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <Label htmlFor="image" className="cursor-pointer text-sm text-primary hover:underline">
                  Clique para fazer upload
                </Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou WEBP (máx. 5MB)</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cor de fundo */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <h3 className="text-base font-semibold">Cor de Fundo</h3>
            <p className="text-xs text-muted-foreground">Escolha uma cor para destacar sua vaga</p>
            <div className="flex gap-2 flex-wrap">
              {backgroundColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color.value ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Candidaturas pela plataforma */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="allowPlatformApplications"
                checked={allowPlatformApplications}
                onChange={(e) => setAllowPlatformApplications(e.target.checked)}
                className="mt-1"
              />
              <div>
                <Label htmlFor="allowPlatformApplications" className="text-sm font-medium cursor-pointer">
                  Permitir candidaturas pela plataforma
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Os candidatos poderão se candidatar diretamente pela plataforma com WhatsApp e currículo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de submit */}
        <Button type="submit" className="w-full" disabled={loading || !selectedCityId}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Publicando...
            </>
          ) : (
            "Publicar Vaga"
          )}
        </Button>
      </form>

      {/* Dialog de verificação necessária */}
      <VerificationRequiredDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog} />
    </>
  )
}
