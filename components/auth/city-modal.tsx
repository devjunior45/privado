"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MapPin } from "lucide-react"
import { CitySelect } from "@/components/ui/city-select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface CityModalProps {
  open: boolean
  onComplete: () => void
}

export function CityModal({ open, onComplete }: CityModalProps) {
  const [cityId, setCityId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cityId) {
      setError("Por favor, selecione uma cidade")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não encontrado")
      }

      // Buscar informações da cidade
      const { data: cityData } = await supabase.from("cities").select("name, state").eq("id", cityId).single()

      const updateData: any = {
        city_id: cityId,
      }

      if (cityData) {
        updateData.city = cityData.name
        updateData.state = cityData.state
      }

      const { error: updateError } = await supabase.from("profiles").update(updateData).eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      router.refresh()
      onComplete()
    } catch (err: any) {
      console.error("Erro ao salvar cidade:", err)
      setError(err.message || "Erro ao salvar cidade")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Qual é a sua cidade?</DialogTitle>
          <DialogDescription className="text-center">
            Precisamos da sua cidade para mostrar vagas próximas a você
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="city">Selecione sua cidade</Label>
            <CitySelect
              value={cityId}
              onValueChange={setCityId}
              placeholder="Escolha sua cidade"
              disabled={isLoading}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Você poderá ver vagas em outras cidades também. Esta é apenas sua cidade principal.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading || !cityId}>
            {isLoading ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
