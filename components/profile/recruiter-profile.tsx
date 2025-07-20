import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building, Plus, Shield, ShieldCheck, Mail } from "lucide-react"
import type { UserProfile } from "@/types/profile"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { CityDisplay } from "@/components/ui/city-display"
import { RecruiterProfileClient } from "./recruiter-profile-client"
import { WhatsAppButton } from "@/components/ui/whatsapp-button"

interface RecruiterProfileProps {
  profile: UserProfile & { phone_visible?: boolean; email_visible?: boolean }
  isOwnProfile?: boolean
}

export async function RecruiterProfile({ profile, isOwnProfile = false }: RecruiterProfileProps) {
  const supabase = await createClient()

  // Buscar vagas ativas do recrutador
  const { data: activeJobs } = await supabase
    .from("job_posts")
    .select("id, title, location")
    .eq("author_id", profile.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  // Verificar se há solicitação de verificação pendente
  const { data: pendingVerification } = await supabase
    .from("verification_requests")
    .select("created_at")
    .eq("user_id", profile.id)
    .eq("status", "pending")
    .single()

  const formatCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, "")
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  // Verificar se deve mostrar botões de contato
  const shouldShowWhatsApp = isOwnProfile || profile.phone_visible !== false
  const shouldShowEmail = isOwnProfile || profile.email_visible !== false

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Header do Perfil */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Perfil da Empresa</CardTitle>
          {isOwnProfile && <RecruiterProfileClient profile={profile} />}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.company_name || ""} />
                <AvatarFallback className="text-2xl">
                  {(profile.company_name || profile.full_name || profile.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Badge de Verificação */}
              {profile.is_verified ? (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              ) : pendingVerification ? (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-bold">{profile.company_name || profile.full_name || profile.username}</h1>
                {profile.is_verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Verificada
                  </Badge>
                )}
                {!profile.is_verified && pendingVerification && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Em Análise
                  </Badge>
                )}
              </div>

              {profile.city_id && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <CityDisplay cityId={profile.city_id} fallback={profile.company_location} />
                </div>
              )}

              {profile.cnpj && <p className="text-sm text-muted-foreground mt-1">CNPJ: {formatCNPJ(profile.cnpj)}</p>}
            </div>

            {profile.professional_summary && (
              <p className="text-sm text-muted-foreground">{profile.professional_summary}</p>
            )}

            {/* Botões de Contato - Condicionais baseados na visibilidade */}
            {(shouldShowWhatsApp || shouldShowEmail) && (
              <div className="flex gap-2 w-full">
                {shouldShowWhatsApp && profile.whatsapp && (
                  <WhatsAppButton whatsapp={profile.whatsapp} className="flex-1" />
                )}
                {shouldShowEmail && profile.email && (
                  <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                    <a href={`mailto:${profile.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Verificação */}
            {isOwnProfile && !profile.is_verified && !pendingVerification && (
              <RecruiterProfileClient profile={profile} showVerificationButton />
            )}

            {isOwnProfile && pendingVerification && !profile.is_verified && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg w-full">
                <p className="text-sm text-yellow-800">
                  Solicitação de verificação enviada em{" "}
                  {new Date(pendingVerification.created_at).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-xs text-yellow-600 mt-1">Nossa equipe entrará em contato em breve</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vagas Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5" />
            Vagas Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeJobs && activeJobs.length > 0 ? (
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <Link href={`/feed?post=${job.id}`} key={job.id}>
                  <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-2">Nenhuma vaga ativa no momento</p>
          )}

          {isOwnProfile && (
            <Button className="w-full mt-4" asChild>
              <Link href="/create-job">
                <Plus className="w-4 h-4 mr-2" />
                Publicar Nova Vaga
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
