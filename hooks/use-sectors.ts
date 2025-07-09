"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Sector {
  id: number
  name: string
}

export function useSectors() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSectors = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("sectors").select("id, name").order("name", { ascending: true })

      if (error) {
        console.error("Error fetching sectors:", error)
      } else {
        setSectors(data || [])
      }
      setIsLoading(false)
    }

    fetchSectors()
  }, [])

  return { sectors, isLoading }
}
