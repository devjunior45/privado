"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CompleteProfileModal } from "./complete-profile-modal"

export function ProfileCheckWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [missingField, setMissingField] = useState<"name" | "city" | null>(null)
  const [currentName, setCurrentName] = useState("")
  const [currentCityId, setCurrentCityId] = useState<number | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkProfile()
  }, [])

  const checkProfile = async () => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsChecking(false)
        return
      }

      const { data: profile } = await supabase.from("profiles").select("full_name, city_id").eq("id", user.id).single()

      if (profile) {
        setCurrentName(profile.full_name || "")
        setCurrentCityId(profile.city_id)

        // Verifica primeiro o nome
        if (!profile.full_name || profile.full_name.trim() === "") {
          setMissingField("name")
          setIsOpen(true)
        }
        // Depois verifica a cidade
        else if (!profile.city_id) {
          setMissingField("city")
          setIsOpen(true)
        }
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleComplete = () => {
    setIsOpen(false)
    // Recheck após salvar para ver se precisa preencher outro campo
    setTimeout(() => {
      checkProfile()
    }, 500)
  }

  if (isChecking) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <CompleteProfileModal
        isOpen={isOpen}
        missingField={missingField}
        currentName={currentName}
        currentCityId={currentCityId}
        onComplete={handleComplete}
      />
    </>
  )
}
