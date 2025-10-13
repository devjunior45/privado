"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface NameModalProps {
  open: boolean
  onComplete: () => void
}

export function NameModal({ open, onComplete }: NameModalProps) {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Por favor, digite seu nome")
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

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      router.refresh()
      onComplete()
    } catch (err: any) {
      console.error("Erro ao salvar nome:", err)
      setError(err.message || "Erro ao salvar nome")
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
              <User className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Qual é o seu nome?</DialogTitle>
          <DialogDescription className="text-center">
            Precisamos do seu nome para completar seu perfil
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Continuar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
