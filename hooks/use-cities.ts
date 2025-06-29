"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { City } from "@/types/city"

// Cache global para evitar múltiplas requisições
let citiesCache: City[] | null = null
let citiesPromise: Promise<City[]> | null = null

export function useCities() {
  const [cities, setCities] = useState<City[]>(citiesCache || [])
  const [isLoading, setIsLoading] = useState(!citiesCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCities() {
      // Se já temos cache, usar ele
      if (citiesCache) {
        setCities(citiesCache)
        setIsLoading(false)
        return
      }

      // Se já existe uma promise em andamento, aguardar ela
      if (citiesPromise) {
        try {
          const cachedCities = await citiesPromise
          setCities(cachedCities)
          setIsLoading(false)
          return
        } catch (err) {
          setError("Erro ao carregar cidades")
          setIsLoading(false)
          return
        }
      }

      // Criar nova promise para buscar cidades
      citiesPromise = (async () => {
        try {
          const supabase = createClient()
          const { data, error } = await supabase.from("cities").select("*").order("region").order("name")

          if (error) throw error

          const fetchedCities = data || []
          citiesCache = fetchedCities
          return fetchedCities
        } catch (err) {
          console.error("Erro ao buscar cidades:", err)
          throw err
        } finally {
          citiesPromise = null
        }
      })()

      try {
        const fetchedCities = await citiesPromise
        setCities(fetchedCities)
      } catch (err) {
        setError("Erro ao carregar cidades")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCities()
  }, [])

  return { cities, isLoading, error }
}

// Função para pré-carregar cidades
export function preloadCities() {
  if (!citiesCache && !citiesPromise) {
    const supabase = createClient()
    citiesPromise = supabase
      .from("cities")
      .select("*")
      .order("region")
      .order("name")
      .then(({ data }) => {
        citiesCache = data || []
        citiesPromise = null
        return citiesCache
      })
  }
  return citiesPromise
}
