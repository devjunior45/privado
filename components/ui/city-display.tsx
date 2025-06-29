"use client"

import { useCityName } from "@/hooks/use-city-name"

interface CityDisplayProps {
  cityId: number | null
  fallback?: string
  className?: string
}

export function CityDisplay({ cityId, fallback, className }: CityDisplayProps) {
  const { cityName, isLoading } = useCityName(cityId)

  if (isLoading) {
    return <span className={className}>Carregando...</span>
  }

  return <span className={className}>{cityName || fallback || "Localização não informada"}</span>
}
