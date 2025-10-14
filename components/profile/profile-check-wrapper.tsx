"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CompleteProfileModal } from "./complete-profile-modal"

interface ProfileCheckWrapperProps {
  children: React.ReactNode
  userProfile: any
}

export function ProfileCheckWrapper({ children, userProfile }: ProfileCheckWrapperProps) {
  const [showModal, setShowModal] = useState(false)
  const [missingField, setMissingField] = useState<"name" | "city" | null>(null)

  useEffect(() => {
    if (!userProfile) return

    // Verifica se falta o nome
    if (!userProfile.full_name || userProfile.full_name.trim() === "") {
      setMissingField("name")
      setShowModal(true)
      return
    }

    // Verifica se falta a cidade
    if (!userProfile.city_id) {
      setMissingField("city")
      setShowModal(true)
      return
    }

    // Perfil completo
    setMissingField(null)
    setShowModal(false)
  }, [userProfile])

  const handleComplete = () => {
    // Após completar um campo, verifica o próximo
    if (missingField === "name" && !userProfile.city_id) {
      setMissingField("city")
    } else {
      setShowModal(false)
      setMissingField(null)
    }
  }

  return (
    <>
      {children}
      {userProfile && (
        <CompleteProfileModal
          isOpen={showModal}
          missingField={missingField}
          currentName={userProfile.full_name || ""}
          currentCityId={userProfile.city_id}
          onComplete={handleComplete}
        />
      )}
    </>
  )
}
