"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { UserTypeModal } from "@/components/auth/user-type-modal"
import { CitySelectionModal } from "@/components/auth/city-selection-modal"
import { generateUsername } from "@/utils/username-generator"

type SetupStep = "user-type" | "city" | "completing"

export default function SetupAccountPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<SetupStep>("user-type")
  const [selectedUserType, setSelectedUserType] = useState<"candidate" | "recruiter" | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthAndProfile()
  }, [])

  const checkAuthAndProfile = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Verificar se já tem perfil completo
    const { data: profile } = await supabase.from("profiles").select("user_type, city_id").eq("id", user.id).single()

    if (profile?.user_type && profile?.city_id) {
      // Perfil já completo, redirecionar
      router.push("/feed")
      return
    }

    setIsLoading(false)
  }

  const handleUserTypeSelect = async (userType: "candidate" | "recruiter") => {
    setSelectedUserType(userType)
    setCurrentStep("city")
  }

  const handleCitySelect = async (cityId: number) => {
    if (!selectedUserType) return

    setCurrentStep("completing")
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    try {
      // Buscar informações da cidade
      const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", cityId).single()

      // Gerar username se não existir
      let username = user.user_metadata?.username
      if (!username) {
        const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "user"
        username = await generateUsername(fullName)
      }

      // Atualizar perfil com tipo de usuário e cidade
      const updateData: any = {
        user_type: selectedUserType,
        city_id: cityId,
        username,
        full_name: user.user_metadata?.full_name || username,
        email: user.email,
      }

      if (cityData) {
        updateData.city = cityData.name
        updateData.state = cityData.state
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id)

      if (error) {
        console.error("Erro ao atualizar perfil:", error)
        alert("Erro ao configurar conta. Tente novamente.")
        setCurrentStep("user-type")
        return
      }

      // Redirecionar para o feed
      router.push("/feed")
      router.refresh()
    } catch (error) {
      console.error("Erro no setup:", error)
      alert("Erro ao configurar conta. Tente novamente.")
      setCurrentStep("user-type")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <UserTypeModal open={currentStep === "user-type"} onSelect={handleUserTypeSelect} />

      {selectedUserType && (
        <CitySelectionModal open={currentStep === "city"} userType={selectedUserType} onSelect={handleCitySelect} />
      )}

      {currentStep === "completing" && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Configurando sua conta...</p>
          </div>
        </div>
      )}
    </>
  )
}
