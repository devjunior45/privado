"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"

interface NameInputModalProps {
  open: boolean
  onSubmit: (name: string) => void
}

export function NameInputModal({ open, onSubmit }: NameInputModalProps) {
  const [name, setName] = useState("")

  const handleContinue = () => {
    if (name.trim()) {
      onSubmit(name.trim())
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
            Precisamos do seu nome para completar o cadastro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="full-name">Nome Completo</Label>
            <Input
              id="full-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              autoFocus
            />
          </div>

          <Button onClick={handleContinue} className="w-full" disabled={!name.trim()}>
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
