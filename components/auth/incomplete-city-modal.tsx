"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CitySelect } from "@/components/ui/city-select"
import { MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface IncompleteCityModalProps {
  open: boolean
  userId: string
}

export function IncompleteCityModal({ open, userId }: IncompleteCityModalProps) {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!selectedCityId) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Buscar dados da cidade
      const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", selectedCityId).single()

      // Atualizar perfil com cidade
      const { error } = await supabase
        .from("profiles")
        .update({
          city_id: selectedCityId,
          city: cityData?.name,
          state: cityData?.state,
        })
        .eq("id", userId)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Erro ao atualizar cidade:", error)
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
            Complete seu Perfil
          </DialogTitle>
          <DialogDescription className="text-center">Por favor, informe sua cidade para continuar</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              📍 Sua cidade é importante para mostrar vagas relevantes para você
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Selecione sua cidade</label>
            <CitySelect
              value={selectedCityId}
              onValueChange={setSelectedCityId}
              placeholder="Escolha sua cidade"
              className="w-full"
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!selectedCityId || isLoading}>
            {isLoading ? "Salvando..." : "Salvar e Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
