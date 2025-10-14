"use client"

import { useEffect, useState } from "react"
import { IncompleteCityModal } from "./incomplete-city-modal"
import { IncompleteNameModal } from "./incomplete-name-modal"

interface ProfileCompletionCheckProps {
  userId: string
  fullName: string | null
  cityId: number | null
}

export function ProfileCompletionCheck({ userId, fullName, cityId }: ProfileCompletionCheckProps) {
  const [showNameModal, setShowNameModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)

  useEffect(() => {
    // Verificar se falta o nome
    if (!fullName || fullName.trim() === "") {
      setShowNameModal(true)
      return
    }

    // Verificar se falta a cidade (apenas se o nome estiver preenchido)
    if (!cityId) {
      setShowCityModal(true)
      return
    }
  }, [fullName, cityId])

  // Quando o nome for salvo, fechar modal de nome e mostrar modal de cidade se necessário
  useEffect(() => {
    if (fullName && fullName.trim() !== "" && showNameModal) {
      setShowNameModal(false)
      if (!cityId) {
        setShowCityModal(true)
      }
    }
  }, [fullName, cityId, showNameModal])

  return (
    <>
      <IncompleteNameModal open={showNameModal} userId={userId} />
      <IncompleteCityModal open={showCityModal && !showNameModal} userId={userId} />
    </>
  )
}
