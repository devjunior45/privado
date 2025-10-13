"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CitySelect } from "@/components/ui/city-select"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface MissingCityModalProps {
  open: boolean
  onSaved: () => void
}

export function MissingCityModal({ open, onSaved }: MissingCityModalProps) {
  const [cityId, setCityId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    if (!cityId) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("profiles").update({ city_id: cityId }).eq("id", user.id)

      if (error) throw error

      onSaved()
    } catch (error) {
      console.error("Error saving city:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent hideClose className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecione sua cidade</DialogTitle>
          <DialogDescription>
            Escolha sua cidade principal. Você poderá ver e postar vagas em outras cidades depois.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cidade</Label>
            <CitySelect value={cityId} onValueChange={setCityId} disabled={isLoading} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!cityId || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
