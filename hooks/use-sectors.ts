"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Sector {
  id: number
  name: string
}

export function useSectors() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("sectors").select("id, name").order("name")

        if (error) throw error

        setSectors(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar setores")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSectors()
  }, [])

  return { sectors, isLoading, error }
}
