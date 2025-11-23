"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Shield, ShieldCheck, MessageCircle } from "lucide-react"
import type { UserProfile } from "@/types/profile"
import { CitySelect } from "@/components/ui/city-select"
import { updateRecruiterProfile } from "@/app/actions/profile"
import { toast } from "sonner"
import { SettingsSheet } from "@/components/ui/settings-sheet"
import { compressImage } from "@/utils/compress-image"

interface RecruiterProfileClientProps {
  profile: UserProfile
  showVerificationButton?: boolean
}

export function RecruiterProfileClient({ profile, showVerificationButton = false }: RecruiterProfileClientProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(profile.city_id || null)
  const [isLoading, setIsLoading] = useState(false)

  const whatsappLink = "https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20assinar%20o%20Busca%20Empregos%2B"

  const handleProfileSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      // Comprimir avatar se foi enviado
      const avatarFile = formData.get("avatar") as File
      if (avatarFile && avatarFile.size > 0) {
        const compressedAvatar = await compressImage(avatarFile, 400)
        formData.set("avatar", compressedAvatar)
      }

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

  if (showVerificationButton) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setIsUpgradeModalOpen(true)} className="w-full">
          <Shield className="w-4 h-4 mr-2" />
          Assine o Busca Empregos+
        </Button>

        {/* Modal Busca Empregos+ */}
        <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Busca Empregos+
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Desbloqueie todos os recursos premium e destaque sua empresa!
              </p>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-3">✨ Benefícios Exclusivos</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Vagas ilimitadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Selo de verificação oficial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Prioridade no feed de vagas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Suporte dedicado via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Destaque para sua empresa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Estatísticas avançadas</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => window.open(whatsappLink, "_blank")} className="w-full gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Assinar Busca Empregos+
                </Button>
                <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)} className="w-full">
                  Voltar
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

      {/* Dialog para Editar Perfil */}
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
