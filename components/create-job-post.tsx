"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Info } from "lucide-react"
import { backgroundColors } from "@/utils/generate-job-image"
import { createJobPost } from "@/app/actions/posts"
import { CitySelect } from "@/components/ui/city-select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function CreateJobPost() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [allowPlatformApplications, setAllowPlatformApplications] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      // Adicionar cityId ao FormData
      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      // Adicionar configuração de candidaturas
      formData.append("allowPlatformApplications", allowPlatformApplications.toString())

      await createJobPost(formData)
      setIsOpen(false)
      setSelectedCityId(null)
      setAllowPlatformApplications(false)
    } catch (error) {
      console.error("Erro ao criar post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50">
          <Plus className="w-6 h-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Vaga de Emprego</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Vaga</Label>
            <Input id="title" name="title" placeholder="Ex: Desenvolvedor Frontend" required />
          </div>

          <div>
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" name="company" placeholder="Nome da empresa" required />
          </div>

          <div>
            <Label htmlFor="cityId">Localização</Label>
            <CitySelect value={selectedCityId} onValueChange={setSelectedCityId} placeholder="Selecione a cidade" />
          </div>

          <div>
            <Label htmlFor="salary">Salário (opcional)</Label>
            <Input id="salary" name="salary" placeholder="Ex: R$ 5.000 - R$ 8.000" />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva a vaga, requisitos, benefícios..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="image">Imagem (opcional)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>

          <div>
            <Label>Cor de Fundo (para posts sem imagem)</Label>
            <div className="flex gap-2 mt-2">
              {backgroundColors.map((color, index) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="backgroundColor"
                    value={color}
                    defaultChecked={index === 0}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-800"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Nova seção para candidaturas na plataforma */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allowPlatformApplications"
                checked={allowPlatformApplications}
                onCheckedChange={setAllowPlatformApplications}
              />
              <Label htmlFor="allowPlatformApplications" className="text-sm font-medium">
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
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Publicando..." : "Publicar Vaga"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
