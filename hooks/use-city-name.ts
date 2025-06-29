"use client"

import { useMemo } from "react"
import { useCities } from "./use-cities"
import { findCityById } from "@/utils/city-utils"

export function useCityName(cityId: number | null) {
  const { cities, isLoading } = useCities()

  const cityName = useMemo(() => {
    if (!cityId || isLoading) return null
    const city = findCityById(cities, cityId)
    return city ? `${city.name}, ${city.state}` : null
  }, [cityId, cities, isLoading])

  return { cityName, isLoading }
}
