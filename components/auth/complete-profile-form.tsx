"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, Eye, MapPin, User } from "lucide-react"
import { CitySelect } from "@/components/ui/city-select"
import { generateUniqueUsername } from "@/utils/username-generator"
import type { UserType } from "@/types/profile"
import Image from "next/image"

type CompleteProfileStep = "user-type" | "city-selection" | "personal-info"

interface CompleteProfileFormProps {
  user: any
  existingProfile: any
  isGoogleAuth?: boolean
}

export function CompleteProfileForm({ user, existingProfile, isGoogleAuth = false }: CompleteProfileFormProps) {
  const [currentStep, setCurrentStep] = useState<CompleteProfileStep>("user-type")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [userType, setUserType] = useState<UserType>("candidate")
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [fullName, setFullName] = useState(
    existingProfile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "",
  )
  const router = useRouter()

  useEffect(() => {
    console.log("CompleteProfileForm - Props:", {
      user: user?.id,
      existingProfile,
      isGoogleAuth,
    })
  }, [user, existingProfile, isGoogleAuth])

  const handleUserTypeSelect = (type: UserType) => {
    console.log("Tipo de usuário selecionado:", type)
    setUserType(type)
    setCurrentStep("city-selection")
  }

  const handleCityNext = () => {
    console.log("Cidade selecionada:", selectedCityId)
    setCurrentStep("personal-info")
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("Completando perfil com dados:", {
      userType,
      selectedCityId,
      fullName,
    })

    const supabase = createClient()

    try {
      // Gerar username único se não existir
      let username = existingProfile?.username
      if (!username) {
        username = await generateUniqueUsername(fullName)
        console.log("Username gerado:", username)
      }

      // Atualizar ou criar perfil
      const profileData = {
        id: user.id,
        username,
        full_name: fullName,
        email: user.email,
        user_type: userType,
        city_id: selectedCityId,
        avatar_url: existingProfile?.avatar_url || user.user_metadata?.avatar_url || null,
        created_at: existingProfile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Dados do perfil a serem salvos:", profileData)

      const { data: savedProfile, error: profileError } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" })
        .select()
        .single()

      if (profileError) {
        console.error("Erro ao salvar perfil:", profileError)
        throw profileError
      }

      console.log("Perfil salvo com sucesso:", savedProfile)
      console.log("Redirecionando para feed...")

      router.push("/feed")
      router.refresh()
    } catch (error: any) {
      console.error("Erro ao completar perfil:", error)
      setError(error.message || "Erro ao salvar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const renderUserTypeStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-6">
          <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold">Complete seu Perfil</h2>
        <p className="text-muted-foreground">
          {isGoogleAuth ? "Bem-vindo! O que você pretende fazer?" : "O que você pretende fazer?"}
        </p>
      </div>

      {isGoogleAuth && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200 text-center">
            ✓ Conta Google conectada com sucesso!
          </p>
        </div>
      )}

      <div className="space-y-4">
        <Button
          onClick={() => handleUserTypeSelect("candidate")}
          className="w-full h-20 flex flex-col items-center justify-center gap-2"
          variant="outline"
        >
          <Eye className="w-6 h-6" />
          <div className="text-center">
            <p className="font-medium">Ver vagas na minha cidade</p>
            <p className="text-xs text-muted-foreground">Encontrar oportunidades de trabalho</p>
          </div>
        </Button>

        <Button
          onClick={() => handleUserTypeSelect("recruiter")}
          className="w-full h-20 flex flex-col items-center justify-center gap-2"
          variant="outline"
        >
          <Building className="w-6 h-6" />
          <div className="text-center">
            <p className="font-medium">Postar vagas na minha cidade</p>
            <p className="text-xs text-muted-foreground">Divulgar oportunidades de trabalho</p>
          </div>
        </Button>
      </div>
    </div>
  )

  const renderCitySelectionStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-6">
          <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <MapPin className="w-6 h-6" />
          Sua Cidade
        </h2>
        <p className="text-muted-foreground">
          {userType === "candidate"
            ? "Escolha sua cidade para ver vagas próximas"
            : "Escolha sua cidade base para suas vagas"}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Não se preocupe!</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Você poderá {userType === "candidate" ? "ver vagas" : "postar vagas"} em outras cidades também. Esta é
                apenas sua cidade principal.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="city-select">Selecione sua cidade</Label>
          <CitySelect
            value={selectedCityId}
            onValueChange={setSelectedCityId}
            placeholder="Escolha sua cidade"
            className="w-full"
          />
        </div>

        <Button onClick={handleCityNext} className="w-full" disabled={!selectedCityId}>
          Continuar
        </Button>
      </div>
    </div>
  )

  const renderPersonalInfoStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-6">
          <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <User className="w-6 h-6" />
          Seus Dados
        </h2>
        <p className="text-muted-foreground">Finalize seu perfil</p>
      </div>

      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleCompleteProfile} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Digite seu nome completo"
          />
          {isGoogleAuth && (
            <p className="text-xs text-muted-foreground mt-1">Você pode editar o nome que veio do Google se preferir</p>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm font-medium">Resumo do seu perfil:</p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <strong>Tipo:</strong> {userType === "candidate" ? "Candidato" : "Recrutador"}
            </p>
            <p>
              <strong>Cidade:</strong> {selectedCityId ? "Selecionada" : "Não selecionada"}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            {isGoogleAuth && (
              <p className="text-green-600 dark:text-green-400">
                <strong>✓ Conectado via Google</strong>
              </p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Finalizar Cadastro"}
        </Button>
      </form>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "user-type":
        return renderUserTypeStep()
      case "city-selection":
        return renderCitySelectionStep()
      case "personal-info":
        return renderPersonalInfoStep()
      default:
        return renderUserTypeStep()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">{renderCurrentStep()}</div>
  )
}
