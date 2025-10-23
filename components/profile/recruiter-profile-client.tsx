"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Star, MessageCircle } from "lucide-react"
import type { UserProfile } from "@/types/profile"
import { CitySelect } from "@/components/ui/city-select"
import { updateRecruiterProfile } from "@/app/actions/profile"
import { toast } from "sonner"
import { SettingsSheet } from "@/components/ui/settings-sheet"

interface RecruiterProfileClientProps {
  profile: UserProfile
  showSubscriptionButton?: boolean
}

export function RecruiterProfileClient({ profile, showSubscriptionButton = false }: RecruiterProfileClientProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(profile.city_id || null)
  const [isLoading, setIsLoading] = useState(false)

  const whatsappNumber = "5511999999999" // Substitua pelo número real
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre a assinatura do Busca Empregos.")}`

  const handleProfileSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      await updateRecruiterProfile(formData)
      setIsEditOpen(false)
      toast.success("Perfil atualizado com sucesso!")
      window.location.reload()
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (showSubscriptionButton) {
    return (
      <>
        <Button
          variant="default"
          size="sm"
          onClick={() => setIsSubscriptionOpen(true)}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
        >
          <Star className="w-4 h-4 mr-2 fill-current" />
          Assine o Busca Empregos
        </Button>

        <Dialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold text-primary flex items-center justify-center gap-2">
                <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                Assine o Busca Empregos
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4 text-center">Assine o plano e destaque sua empresa!</h3>
                <p className="text-center text-muted-foreground mb-6">
                  Ganhe mais visibilidade e credibilidade no feed de vagas.
                </p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Publique mais oportunidades</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Receba o selo de verificação</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Transmita confiança aos candidatos</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Tenha suporte sempre disponível</p>
                  </div>
                </div>

                <p className="text-center text-sm font-semibold mt-6 text-primary">
                  Invista no seu crescimento e encontre os melhores talentos mais rápido!
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
                  size="lg"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Star className="w-5 h-5 mr-2 fill-current" />
                    Assinar Plano
                  </a>
                </Button>

                <Button variant="outline" className="w-full bg-transparent" size="lg" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Dúvidas
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
        <SettingsSheet />
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Perfil da Empresa</DialogTitle>
          </DialogHeader>

          <form action={handleProfileSubmit} className="space-y-4">
            <div>
              <Label htmlFor="avatar">Logo da Empresa</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" />
              {profile.avatar_url && (
                <p className="text-xs text-muted-foreground mt-1">Selecione uma nova imagem para substituir a atual</p>
              )}
            </div>

            <div>
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input id="companyName" name="companyName" defaultValue={profile.company_name || ""} required />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input
                id="cnpj"
                name="cnpj"
                defaultValue={profile.cnpj || ""}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            <div>
              <Label htmlFor="cityId">Cidade *</Label>
              <CitySelect
                value={selectedCityId}
                onValueChange={setSelectedCityId}
                placeholder="Selecione a cidade da empresa"
                name="cityId"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={profile.whatsapp || ""}
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" defaultValue={profile.email || ""} required />
            </div>

            <div>
              <Label htmlFor="description">Descrição da Empresa</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={profile.professional_summary || ""}
                placeholder="Descreva sua empresa, área de atuação, valores..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
