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
}

export function MissingNameModal({ open, userId }: MissingNameModalProps) {
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!fullName.trim()) return

    setIsLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", userId)

      if (error) throw error

      router.refresh()
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
            Qual é o seu nome?
          </DialogTitle>
          <DialogDescription className="text-center">
            Para continuar, precisamos saber como devemos te chamar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">💡 Este nome será exibido no seu perfil público</p>
          </div>

          <div>
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full"
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={!fullName.trim() || isLoading}>
            {isLoading ? "Salvando..." : "Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
