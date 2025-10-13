"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CitySelect } from "@/components/ui/city-select"
import { createClient } from "@/lib/supabase/client"
import { Loader2, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

interface MissingCityModalProps {
  open: boolean
  onSaved: () => void
}

export function MissingCityModal({ open, onSaved }: MissingCityModalProps) {
  const [cityId, setCityId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!cityId) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error("No user found")
        return
      }

      // Buscar informações da cidade
      const { data: cityData, error: cityError } = await supabase
        .from("cities")
        .select("name, state")
        .eq("id", cityId)
        .single()

      if (cityError) {
        console.error("Error fetching city:", cityError)
        throw cityError
      }

      if (!cityData) {
        console.error("City not found")
        return
      }

      // Atualizar perfil com city_id, city e state
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          city_id: cityId,
          city: cityData.name,
          state: cityData.state,
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating profile:", updateError)
        throw updateError
      }

      // Refresh e chamar callback
      router.refresh()
      onSaved()
    } catch (error) {
      console.error("Error saving city:", error)
      alert("Erro ao salvar cidade. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <MapPin className="w-6 h-6" />
            Selecione sua cidade
          </DialogTitle>
          <DialogDescription className="text-center">
            Escolha sua cidade principal. Você poderá ver e postar vagas em outras cidades depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Dica:</strong> Esta será sua cidade principal, mas você poderá interagir com vagas de outras
              cidades também.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city-select">Cidade *</Label>
            <CitySelect
              value={cityId}
              onValueChange={(value) => {
                console.log("City selected:", value)
                setCityId(value)
              }}
              disabled={isLoading}
              placeholder="Selecione sua cidade"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleSave} disabled={!cityId || isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Salvando..." : "Salvar e Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
