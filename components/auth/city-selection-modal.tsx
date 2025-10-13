"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CitySelect } from "@/components/ui/city-select"
import { MapPin } from "lucide-react"

interface CitySelectionModalProps {
  open: boolean
  userType: "candidate" | "recruiter"
  onSelect: (cityId: number) => void
}

export function CitySelectionModal({ open, userType, onSelect }: CitySelectionModalProps) {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)

  const handleContinue = () => {
    if (selectedCityId) {
      onSelect(selectedCityId)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <MapPin className="w-6 h-6" />
            Sua Cidade
          </DialogTitle>
          <DialogDescription className="text-center">
            {userType === "candidate"
              ? "Escolha sua cidade para ver vagas próximas"
              : "Escolha sua cidade base para suas vagas"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Dica:</strong> Você poderá {userType === "candidate" ? "ver vagas" : "postar vagas"} em outras
              cidades também. Esta é apenas sua cidade principal.
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

          <Button onClick={handleContinue} className="w-full" disabled={!selectedCityId}>
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
