"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Shield } from "lucide-react"
import type { UserProfile } from "@/types/profile"
import { CitySelect } from "@/components/ui/city-select"
import { updateRecruiterProfile, requestVerification } from "@/app/actions/profile"
import { toast } from "sonner"

interface RecruiterProfileClientProps {
  profile: UserProfile
  showVerificationButton?: boolean
}

export function RecruiterProfileClient({ profile, showVerificationButton = false }: RecruiterProfileClientProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(profile.city_id || null)
  const [isLoading, setIsLoading] = useState(false)

  const handleProfileSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      await updateRecruiterProfile(formData)
      setIsEditOpen(false)
      toast.success("Perfil atualizado com sucesso!")
      window.location.reload() // Refresh to show updated data
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast.error("Erro ao atualizar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationRequest = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await requestVerification(formData)
      setIsVerificationOpen(false)
      toast.success("Solicitação de verificação enviada com sucesso!")
      window.location.reload() // Refresh to show updated status
    } catch (error) {
      console.error("Erro ao solicitar verificação:", error)
      toast.error("Erro ao solicitar verificação. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (showVerificationButton) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setIsVerificationOpen(true)} className="w-full">
          <Shield className="w-4 h-4 mr-2" />
          Solicitar Verificação
        </Button>

        {/* Dialog para Solicitar Verificação */}
        <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Solicitar Verificação da Empresa</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Por que verificar sua empresa?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Maior credibilidade no feed de vagas</li>
                  <li>• Badge de verificação visível</li>
                  <li>• Mais confiança dos candidatos</li>
                  <li>• Destaque nas pesquisas</li>
                </ul>
              </div>

              <form action={handleVerificationRequest} className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    defaultValue={profile.company_name || ""}
                    required
                    placeholder="Nome da sua empresa"
                  />
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
                  <Label htmlFor="contactPhone">Telefone para Contato *</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    defaultValue={profile.whatsapp || ""}
                    placeholder="(11) 99999-9999"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Número que usaremos para entrar em contato e verificar sua empresa
                  </p>
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email para Contato</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    defaultValue={profile.email || ""}
                    placeholder="contato@empresa.com.br"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Informações Adicionais (opcional)</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Conte-nos mais sobre sua empresa, área de atuação, etc."
                    rows={3}
                  />
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Importante:</strong> Nossa equipe entrará em contato pelo telefone informado em até 2 dias
                    úteis para verificar sua empresa. Mantenha o telefone disponível.
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Solicitar Verificação"}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="flex-1">
        <Edit className="w-4 h-4 mr-2" />
        Editar Perfil
      </Button>

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
