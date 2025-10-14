"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MapPin } from "lucide-react"
import { useCities } from "@/hooks/use-cities"
import { groupCitiesByRegion } from "@/utils/city-utils"

interface CompleteProfileModalProps {
  isOpen: boolean
  missingField: "name" | "city" | null
  currentName?: string
  currentCityId?: number | null
  onComplete: () => void
}

export function CompleteProfileModal({
  isOpen,
  missingField,
  currentName = "",
  currentCityId = null,
  onComplete,
}: CompleteProfileModalProps) {
  const [fullName, setFullName] = useState(currentName)
  const [cityId, setCityId] = useState<number | null>(currentCityId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { cities, isLoading: citiesLoading } = useCities()

  useEffect(() => {
    setFullName(currentName)
    setCityId(currentCityId)
  }, [currentName, currentCityId])

  const groupedCities = groupCitiesByRegion(cities)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      const updateData: any = {}

      if (missingField === "name" && fullName.trim()) {
        updateData.full_name = fullName.trim()
      } else if (missingField === "city" && cityId) {
        // Buscar informações da cidade para preencher city e state também
        const selectedCity = cities.find((c) => c.id === cityId)
        if (selectedCity) {
          updateData.city_id = cityId
          updateData.city = selectedCity.name
          updateData.state = selectedCity.state
        }
      }

      const { error: updateError } = await supabase.from("profiles").update(updateData).eq("id", user.id)

      if (updateError) throw updateError

      onComplete()
      router.refresh()
    } catch (err: any) {
      console.error("Erro ao atualizar perfil:", err)
      setError(err.message || "Erro ao salvar")
    } finally {
      setIsLoading(false)
    }
  }

  const isValid = missingField === "name" ? fullName.trim().length > 0 : cityId !== null

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {missingField === "name" ? (
              <>
                <User className="w-5 h-5" />
                Complete seu Nome
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Selecione sua Cidade
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {missingField === "name"
              ? "Por favor, informe seu nome completo para continuar."
              : "Por favor, selecione sua cidade para continuar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {missingField === "name" ? (
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                required
                autoFocus
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="city">Cidade</Label>
              {citiesLoading ? (
                <div className="text-sm text-muted-foreground">Carregando cidades...</div>
              ) : (
                <select
                  id="city"
                  value={cityId || ""}
                  onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Selecione uma cidade...</option>
                  {groupedCities.map((group) => (
                    <optgroup key={group.region} label={group.region}>
                      {group.cities.map((city) => (
                        <option key={city.value} value={city.value}>
                          {city.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading || !isValid || citiesLoading}>
            {isLoading ? "Salvando..." : "Salvar e Continuar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
