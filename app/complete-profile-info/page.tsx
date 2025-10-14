"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { NameInputModal } from "@/components/auth/name-input-modal"
import { CitySelectionModal } from "@/components/auth/city-selection-modal"

type ProfileStep = "checking" | "name" | "city" | "complete"

export default function CompleteProfileInfoPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<ProfileStep>("checking")
  const [userId, setUserId] = useState<string | null>(null)
  const [userType, setUserType] = useState<"candidate" | "recruiter">("candidate")

  useEffect(() => {
    checkProfile()
  }, [])

  const checkProfile = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setUserId(user.id)

    // Buscar perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, city_id, user_type")
      .eq("id", user.id)
      .single()

    if (!profile) {
      router.push("/login")
      return
    }

    setUserType(profile.user_type || "candidate")

    // Verificar o que está faltando
    if (!profile.full_name || profile.full_name.trim() === "") {
      setCurrentStep("name")
    } else if (!profile.city_id) {
      setCurrentStep("city")
    } else {
      // Perfil completo
      setCurrentStep("complete")
      router.push("/feed")
    }
  }

  const handleNameSubmit = async (name: string) => {
    if (!userId) return

    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", userId)

      if (error) {
        console.error("Erro ao atualizar nome:", error)
        alert("Erro ao salvar nome. Tente novamente.")
        return
      }

      // Verificar se precisa preencher cidade
      const { data: profile } = await supabase.from("profiles").select("city_id").eq("id", userId).single()

      if (!profile?.city_id) {
        setCurrentStep("city")
      } else {
        setCurrentStep("complete")
        router.push("/feed")
        router.refresh()
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao salvar. Tente novamente.")
    }
  }

  const handleCitySelect = async (cityId: number) => {
    if (!userId) return

    const supabase = createClient()

    try {
      // Buscar informações da cidade
      const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", cityId).single()

      const updateData: any = {
        city_id: cityId,
      }

      if (cityData) {
        updateData.city = cityData.name
        updateData.state = cityData.state
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

      if (error) {
        console.error("Erro ao atualizar cidade:", error)
        alert("Erro ao salvar cidade. Tente novamente.")
        return
      }

      setCurrentStep("complete")
      router.push("/feed")
      router.refresh()
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao salvar. Tente novamente.")
    }
  }

  if (currentStep === "checking" || currentStep === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <NameInputModal open={currentStep === "name"} onSubmit={handleNameSubmit} />

      <CitySelectionModal open={currentStep === "city"} userType={userType} onSelect={handleCitySelect} />
    </>
  )
}
