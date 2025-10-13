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

    const { data: profile } = await supabase.from("profiles").select("full_name, city_id").eq("id", user.id).single()

    if (profile) {
      // Verificar nome primeiro
      if (!profile.full_name || profile.full_name.trim() === "") {
        setShowNameModal(true)
      }
      // Verificar cidade depois
      else if (!profile.city_id) {
        setShowCityModal(true)
      }
    }

    setIsChecking(false)
  }

  const handleNameComplete = () => {
    setShowNameModal(false)
    // Após completar o nome, verificar se precisa da cidade
    checkCityAfterName()
  }

  const checkCityAfterName = async () => {
    const supabase = createClient()

    if (!userId) return

    const { data: profile } = await supabase.from("profiles").select("city_id").eq("id", userId).single()

    if (profile && !profile.city_id) {
      setShowCityModal(true)
    }
  }

  const handleCityComplete = () => {
    setShowCityModal(false)
  }

  if (isChecking || !userId) return null

  return (
    <>
      {showNameModal && <MissingNameModal open={showNameModal} userId={userId} onComplete={handleNameComplete} />}
      {showCityModal && <MissingCityModal open={showCityModal} userId={userId} onComplete={handleCityComplete} />}
    </>
  )
}
