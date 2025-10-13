"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MissingNameModal } from "./missing-name-modal"
import { MissingCityModal } from "./missing-city-modal"

export function ProfileCompletionCheck() {
  const [userId, setUserId] = useState<string | null>(null)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkProfile()
  }, [])

  const checkProfile = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsChecking(false)
      return
    }

    setUserId(user.id)

    // Buscar perfil
    const { data: profile } = await supabase.from("profiles").select("full_name, city_id").eq("id", user.id).single()

    if (!profile) {
      setIsChecking(false)
      return
    }

    // Verificar campos faltantes
    if (!profile.full_name || profile.full_name.trim() === "") {
      setShowNameModal(true)
    } else if (!profile.city_id) {
      setShowCityModal(true)
    }

    setIsChecking(false)
  }

  // Quando o nome for salvo, verificar a cidade
  useEffect(() => {
    if (!showNameModal && userId && !showCityModal) {
      checkCityAfterName()
    }
  }, [showNameModal])

  const checkCityAfterName = async () => {
    if (!userId) return

    const supabase = createClient()
    const { data: profile } = await supabase.from("profiles").select("city_id").eq("id", userId).single()

    if (!profile?.city_id) {
      setShowCityModal(true)
    }
  }

  if (isChecking || !userId) {
    return null
  }

  return (
    <>
      {showNameModal && <MissingNameModal open={showNameModal} userId={userId} />}
      {showCityModal && !showNameModal && <MissingCityModal open={showCityModal} userId={userId} />}
    </>
  )
}
