"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Info, AlertCircle } from "lucide-react"
import { backgroundColors } from "@/utils/generate-job-image"
import { createJobPost } from "@/app/actions/posts"
import { CitySelect } from "@/components/ui/city-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect } from "@/components/ui/multi-select"
import { useSectors } from "@/hooks/use-sectors"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function CreateJobForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [allowPlatformApplications, setAllowPlatformApplications] = useState(false)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const { sectors, isLoading: sectorsLoading } = useSectors()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)

      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      formData.append("allowPlatformApplications", allowPlatformApplications.toString())
      formData.append("sector_ids", JSON.stringify(selectedSectors))

      await createJobPost(formData)

      toast({
        title: "Vaga criada!",
        description: "Sua vaga foi publicada com sucesso.",
      })

      router.push("/dashboard")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar vaga"
      setError(errorMessage)
      toast({
        title: "Erro ao criar vaga",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-sm">
                Título da Vaga
              </Label>
              <Input id="title" name="title" placeholder="Ex: Desenvolvedor Frontend" required className="h-9" />
            </div>

            <div>
              <Label htmlFor="company" className="text-sm">
                Nome da Empresa
              </Label>
              <Input id="company" name="company" placeholder="Nome da empresa" required className="h-9" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary" className="text-sm">
                Salário (opcional)
              </Label>
              <Input id="salary" name="salary" placeholder="Ex: R$ 5.000 - R$ 8.000" className="h-9" />
            </div>

            <div>
              <Label htmlFor="cityId" className="text-sm">
                Localização
              </Label>
              <CitySelect value={selectedCityId} onValueChange={setSelectedCityId} placeholder="Selecione a cidade" />
            </div>
          </div>

          <div>
            <Label htmlFor="sectors" className="text-sm">
              Setores (opcional)
            </Label>
            <MultiSelect
              options={sectors}
              selected={selectedSectors}
              onChange={setSelectedSectors}
              placeholder="Selecione os setores"
              disabled={sectorsLoading}
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm">
              Descrição
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva a vaga, requisitos, benefícios..."
              rows={4}
              required
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personalização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image" className="text-sm">
              Imagem (opcional)
            </Label>
            <Input id="image" name="image" type="file" accept="image/*" className="h-9" />
          </div>

          <div>
            <Label className="text-sm">Cor de Fundo</Label>
            <p className="text-xs text-muted-foreground mb-2">Para posts sem imagem</p>
            <div className="flex gap-2 flex-wrap">
              {backgroundColors.map((color, index) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="backgroundColor"
                    value={color}
                    defaultChecked={index === 0}
                    className="sr-only peer"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-800 peer-checked:border-gray-800 peer-checked:ring-2 peer-checked:ring-gray-800 peer-checked:ring-offset-2 transition-all"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidaturas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowPlatformApplications"
              checked={allowPlatformApplications}
              onCheckedChange={(checked) => setAllowPlatformApplications(checked as boolean)}
            />
            <Label htmlFor="allowPlatformApplications" className="text-sm font-medium cursor-pointer">
              Permitir candidaturas pela plataforma
            </Label>
          </div>

          {allowPlatformApplications && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Os candidatos poderão se candidatar diretamente pela plataforma enviando seus currículos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isLoading} size="lg">
        {isLoading ? "Publicando..." : "Publicar Vaga"}
      </Button>
    </form>
  )
}
