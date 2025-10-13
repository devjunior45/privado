"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MissingNameModalProps {
  open: boolean
  userId: string
  onComplete: () => void
}

export function MissingNameModal({ open, userId, onComplete }: MissingNameModalProps) {
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!fullName.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
        })
        .eq("id", userId)

      if (error) throw error

      router.refresh()
      onComplete()
    } catch (error) {
      console.error("Erro ao salvar nome:", error)
      alert("Erro ao salvar nome. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <User className="w-6 h-6" />
            Complete seu Perfil
          </DialogTitle>
          <DialogDescription className="text-center">Como devemos te chamar?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && fullName.trim()) {
                  handleSave()
                }
              }}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!fullName.trim() || isLoading}>
            {isLoading ? "Salvando..." : "Salvar e Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
