"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NameModal } from "./name-modal"
import { CityModal } from "./city-modal"

export function ProfileCompletionProvider({ children }: { children: React.ReactNode }) {
  const [showNameModal, setShowNameModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkProfile()
  }, [])

  const checkProfile = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsChecking(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("full_name, city_id").eq("id", user.id).single()

      if (!profile) {
        setIsChecking(false)
        return
      }

      // Verifica campos faltantes
      if (!profile.full_name || profile.full_name.trim() === "") {
        setShowNameModal(true)
      } else if (!profile.city_id) {
        setShowCityModal(true)
      }

      setIsChecking(false)
    } catch (error) {
      console.error("Erro ao verificar perfil:", error)
      setIsChecking(false)
    }
  }

  const handleNameComplete = () => {
    setShowNameModal(false)
    // Após completar o nome, verifica se precisa da cidade
    checkProfile()
  }

  const handleCityComplete = () => {
    setShowCityModal(false)
  }

  if (isChecking) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <NameModal open={showNameModal} onComplete={handleNameComplete} />
      <CityModal open={showCityModal} onComplete={handleCityComplete} />
    </>
  )
}
