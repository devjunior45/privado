"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, Eye, MapPin, Users } from "lucide-react"
import type { UserType } from "@/types/profile"
import { CitySelect } from "@/components/ui/city-select"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useMobile } from "@/hooks/use-mobile"

type CompleteProfileStep = "user-type" | "city-selection" | "personal-info" | "company-info"

interface CompleteProfileFormProps {
  user: any
  existingProfile: any
}

export function CompleteProfileForm({ user, existingProfile }: CompleteProfileFormProps) {
  const [currentStep, setCurrentStep] = useState<CompleteProfileStep>("user-type")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [username, setUsername] = useState(existingProfile?.username || "")
  const [fullName, setFullName] = useState(existingProfile?.full_name || user?.user_metadata?.full_name || "")
  const [companyName, setCompanyName] = useState("")
  const [companyLocation, setCompanyLocation] = useState("")
  const [userType, setUserType] = useState<UserType>(existingProfile?.user_type || "candidate")
  const [selectedCityId, setSelectedCityId] = useState<number | null>(existingProfile?.city_id || null)
  const router = useRouter()
  const { theme } = useTheme()
  const isMobile = useMobile()

  useEffect(() => {
    // Se já tem user_type, pula para city-selection
    if (existingProfile?.user_type) {
      setUserType(existingProfile.user_type)
      setCurrentStep("city-selection")
    }
    // Se já tem city_id também, pula para personal/company info
    if (existingProfile?.user_type && existingProfile?.city_id) {
      setSelectedCityId(existingProfile.city_id)
      setCurrentStep(existingProfile.user_type === "recruiter" ? "company-info" : "personal-info")
    }
  }, [existingProfile])

  const getLogoSrc = () => {
    if (isMobile) {
      return theme === "dark" ? "/temaescuro.png" : "/temaclaro.png"
    }
    return "/logo.empresa.png"
  }

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type)
    setCurrentStep("city-selection")
  }

  const handleCityNext = () => {
    if (userType === "recruiter") {
      setCurrentStep("company-info")
    } else {
      setCurrentStep("personal-info")
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const supabase = createClient()

    try {
      const updateData: any = {
        user_type: userType,
        city_id: selectedCityId,
        full_name: fullName,
        username: username,
      }

      if (userType === "recruiter") {
        updateData.company_name = companyName
        updateData.company_location = companyLocation
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)

      if (error) throw error

      router.push("/feed")
      router.refresh()
    } catch (error: any) {
      console.error("Erro ao completar perfil:", error)
      setError(error.message || "Erro ao completar perfil")
    } finally {
      setIsLoading(false)
    }
  }

  const renderUserTypeStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <h2 className="text-2xl font-bold">Complete seu Perfil</h2>
        <p className="text-muted-foreground">O que você pretende fazer?</p>
      </div>

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
            <p className="font-medium">Postar vagas</p>
            <p className="text-xs text-muted-foreground">Divulgar oportunidades de trabalho</p>
          </div>
        </Button>
      </div>
    </div>
  )

  const renderCitySelectionStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
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
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
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
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <h2 className="text-2xl font-bold">Seus Dados</h2>
        <p className="text-muted-foreground">Complete as informações do seu perfil</p>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleCompleteProfile} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="username">Nome de Usuário</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Completar Perfil"}
        </Button>
      </form>
    </div>
  )

  const renderCompanyInfoStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <h2 className="text-2xl font-bold">Dados da Empresa</h2>
        <p className="text-muted-foreground">Complete as informações da sua empresa</p>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleCompleteProfile} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nome do Responsável</Label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="companyName">Nome da Empresa</Label>
          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="companyLocation">Localização da Empresa</Label>
          <Input
            id="companyLocation"
            value={companyLocation}
            onChange={(e) => setCompanyLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="username">Nome de Usuário</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Completar Perfil"}
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
      case "company-info":
        return renderCompanyInfoStep()
      default:
        return renderUserTypeStep()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">{renderCurrentStep()}</div>
  )
}
