"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Building, Plus, ShieldCheck, Mail, Edit, Grid3X3, List, Eye, MessageCircle, Heart } from "lucide-react"
import type { UserProfile } from "@/types/profile"
import type { JobPost } from "@/types/job-post"
import Link from "next/link"
import { CityDisplay } from "@/components/ui/city-display"
import { CitySelect } from "@/components/ui/city-select"
import { WhatsAppButton } from "@/components/ui/whatsapp-button"
import { updateRecruiterProfile, requestVerification } from "@/app/actions/profile"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RecruiterOwnProfileProps {
  profile: UserProfile
  jobPosts: JobPost[]
}

export function RecruiterOwnProfile({ profile, jobPosts }: RecruiterOwnProfileProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(profile.city_id || null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

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

  const handleVerificationRequest = async (formData: FormData) => {
    setIsLoading(true)
    try {
      await requestVerification(formData)
      setIsVerificationOpen(false)
      toast.success("Solicitação de verificação enviada com sucesso!")
      window.location.reload()
    } catch (error) {
      console.error("Erro ao solicitar verificação:", error)
      toast.error("Erro ao solicitar verificação. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, "")
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  const formatSalary = (salary: string) => {
    if (!salary) return "A combinar"
    const num = Number.parseFloat(salary)
    if (isNaN(num)) return salary
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(num)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header do Perfil */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.company_name || ""} />
                <AvatarFallback className="text-2xl">
                  {(profile.company_name || profile.full_name || profile.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Badge de Verificação */}
              {profile.is_verified && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{profile.company_name || profile.full_name || profile.username}</h1>
                {profile.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verificada
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)} className="h-8 w-8 p-0">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              {profile.city_id && (
                <div className="flex items-center gap-1 text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  <CityDisplay cityId={profile.city_id} fallback={profile.company_location} />
                </div>
              )}

              {profile.cnpj && <p className="text-sm text-muted-foreground mb-2">CNPJ: {formatCNPJ(profile.cnpj)}</p>}

              {profile.professional_summary && (
                <p className="text-sm text-muted-foreground mb-4">{profile.professional_summary}</p>
              )}

              <div className="flex gap-2">
                {profile.whatsapp && <WhatsAppButton whatsapp={profile.whatsapp} size="sm" />}
                {profile.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${profile.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
                <Button asChild>
                  <Link href="/create-job">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Vaga
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Visualização */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Minhas Vagas ({jobPosts.length})</h2>
          <div className="flex gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Lista de Vagas */}
        {jobPosts.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
            {jobPosts.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Building className="w-4 h-4" />
                        <span>{job.company}</span>
                      </div>
                    </div>
                    <Badge variant={job.status === "active" ? "default" : "secondary"}>
                      {job.status === "active" ? "Ativa" : job.status === "paused" ? "Pausada" : "Encerrada"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.description}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-primary">{formatSalary(job.salary)}</span>
                    <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}</span>
                  </div>

                  {/* Estatísticas da Vaga */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{job.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{job.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{job.comments || 0}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <Link href={`/feed?post=${job.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Vaga
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <Link href={`/job-candidates/${job.id}`}>
                        <Building className="w-4 h-4 mr-2" />
                        Candidatos
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma vaga publicada</h3>
            <p className="text-muted-foreground mb-4">Comece publicando sua primeira vaga de emprego</p>
            <Button asChild>
              <Link href="/create-job">
                <Plus className="w-4 h-4 mr-2" />
                Publicar Primeira Vaga
              </Link>
            </Button>
          </div>
        )}
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

      {/* Dialog para Solicitar Verificação */}
      {!profile.is_verified && (
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
      )}
    </div>
  )
}
