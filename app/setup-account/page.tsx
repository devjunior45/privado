"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { UserTypeModal } from "@/components/auth/user-type-modal"
import { CitySelectionModal } from "@/components/auth/city-selection-modal"
import { NameInputModal } from "@/components/auth/name-input-modal"
import type { UserType } from "@/types/profile"
import { generateUsername } from "@/utils/username-generator"

export default function SetupAccountPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showUserTypeModal, setShowUserTypeModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [userName, setUserName] = useState<string>("")
  const [userType, setUserType] = useState<UserType | null>(null)

  useEffect(() => {
    checkUserProfile()
  }, [])

  const checkUserProfile = async () => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Buscar perfil existente
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      // Verificar o que está faltando
      const needsName = !profile?.full_name
      const needsUserType = !profile?.user_type
      const needsCity = !profile?.city_id

      if (!needsName && !needsUserType && !needsCity) {
        // Perfil completo, redirecionar
        router.push("/feed")
        return
      }

      // Mostrar modais na ordem: nome -> tipo -> cidade
      if (needsName) {
        setShowNameModal(true)
      } else if (needsUserType) {
        setUserName(profile?.full_name || "")
        setShowUserTypeModal(true)
      } else if (needsCity) {
        setUserName(profile?.full_name || "")
        setUserType(profile?.user_type || null)
        setShowCityModal(true)
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error)
      router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameSubmit = async (name: string) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Atualizar nome no perfil
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
        })
        .eq("id", user.id)

      if (error) throw error

      setUserName(name)
      setShowNameModal(false)

      // Verificar se precisa de tipo de usuário
      const { data: profile } = await supabase.from("profiles").select("user_type, city_id").eq("id", user.id).single()

      if (!profile?.user_type) {
        setShowUserTypeModal(true)
      } else if (!profile?.city_id) {
        setUserType(profile.user_type)
        setShowCityModal(true)
      } else {
        router.push("/feed")
      }
    } catch (error) {
      console.error("Erro ao salvar nome:", error)
    }
  }

  const handleUserTypeSelect = async (type: UserType) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Atualizar tipo de usuário no perfil
      const { error } = await supabase
        .from("profiles")
        .update({
          user_type: type,
        })
        .eq("id", user.id)

      if (error) throw error

      setUserType(type)
      setShowUserTypeModal(false)

      // Verificar se precisa de cidade
      const { data: profile } = await supabase.from("profiles").select("city_id").eq("id", user.id).single()

      if (!profile?.city_id) {
        setShowCityModal(true)
      } else {
        router.push("/feed")
      }
    } catch (error) {
      console.error("Erro ao salvar tipo de usuário:", error)
    }
  }

  const handleCitySelect = async (cityId: number) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Buscar informações da cidade
      const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", cityId).single()

      // Gerar username se não existir
      const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()

      let username = profile?.username
      if (!username) {
        username = await generateUsername(userName)
      }

      // Atualizar perfil com cidade e username
      const { error } = await supabase
        .from("profiles")
        .update({
          city_id: cityId,
          city: cityData?.name || null,
          state: cityData?.state || null,
          username,
        })
        .eq("id", user.id)

      if (error) throw error

      router.push("/feed")
    } catch (error) {
      console.error("Erro ao salvar cidade:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <NameInputModal open={showNameModal} onSubmit={handleNameSubmit} />
      <UserTypeModal open={showUserTypeModal} onSelect={handleUserTypeSelect} />
      {userType && <CitySelectionModal open={showCityModal} userType={userType} onSelect={handleCitySelect} />}
    </>
  )
}
