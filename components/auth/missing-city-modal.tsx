"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CitySelect } from "@/components/ui/city-select"
import { MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MissingCityModalProps {
  open: boolean
  userId: string
}

export function MissingCityModal({ open, userId }: MissingCityModalProps) {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!selectedCityId) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      // Buscar informações da cidade
      const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", selectedCityId).single()

      const updateData: any = {
        city_id: selectedCityId,
      }

      if (cityData) {
        updateData.city = cityData.name
        updateData.state = cityData.state
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar cidade:", error)
      alert("Erro ao salvar cidade. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <MapPin className="w-6 h-6" />
            Escolha sua cidade
          </DialogTitle>
          <DialogDescription className="text-center">
            Para continuar, precisamos saber em qual cidade você está
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Esta informação é necessária para personalizar sua experiência
            </p>
          </div>

          <div>
            <CitySelect
              value={selectedCityId}
              onValueChange={setSelectedCityId}
              placeholder="Escolha sua cidade"
              className="w-full"
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!selectedCityId || isLoading}>
            {isLoading ? "Salvando..." : "Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
