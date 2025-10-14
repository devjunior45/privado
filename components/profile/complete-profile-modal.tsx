"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CityModal } from "@/components/ui/city-modal"
import { User, MapPin } from "lucide-react"
import { useCities } from "@/hooks/use-cities"
import { formatCityDisplay } from "@/utils/city-utils"

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
  const [isCityModalOpen, setIsCityModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { cities } = useCities()

  useEffect(() => {
    setFullName(currentName)
    setCityId(currentCityId)
  }, [currentName, currentCityId])

  useEffect(() => {
    // Auto-open city modal when it's the missing field
    if (missingField === "city" && isOpen) {
      setIsCityModalOpen(true)
    }
  }, [missingField, isOpen])

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
        updateData.city_id = cityId
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

  const selectedCity = cities.find((city) => city.id === cityId)

  return (
    <>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCityModalOpen(true)}
                  className="w-full justify-between"
                >
                  {selectedCity ? formatCityDisplay(selectedCity) : "Selecione uma cidade"}
                  <MapPin className="w-4 h-4 ml-2 opacity-50" />
                </Button>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
              {isLoading ? "Salvando..." : "Salvar e Continuar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* City Modal - Opens on top of the dialog */}
      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        value={cityId}
        onValueChange={(newCityId) => {
          setCityId(newCityId)
          setIsCityModalOpen(false)
        }}
      />
    </>
  )
}
