"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MissingNameModal } from "./missing-name-modal"
import { MissingCityModal } from "./missing-city-modal"

export function ProfileCompletionCheck() {
  const [showNameModal, setShowNameModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkProfile()
  }, [])

  async function checkProfile() {
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

      // Check if name is missing
      if (!profile.full_name || profile.full_name.trim() === "") {
        setShowNameModal(true)
      }
      // Check if city is missing (only if name is present)
      else if (!profile.city_id) {
        setShowCityModal(true)
      }

      setIsChecking(false)
    } catch (error) {
      console.error("Error checking profile:", error)
      setIsChecking(false)
    }
  }

  const handleNameSaved = () => {
    setShowNameModal(false)
    // After name is saved, check if city is missing
    checkProfile()
  }

  const handleCitySaved = () => {
    setShowCityModal(false)
  }

  if (isChecking) {
    return null
  }

  return (
    <>
      <MissingNameModal open={showNameModal} onSaved={handleNameSaved} />
      <MissingCityModal open={showCityModal} onSaved={handleCitySaved} />
    </>
  )
}
