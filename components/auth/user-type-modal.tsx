"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Briefcase, Building } from "lucide-react"

interface UserTypeModalProps {
  open: boolean
  onSelect: (type: "candidate" | "recruiter") => void
}

export function UserTypeModal({ open, onSelect }: UserTypeModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Bem-vindo!</DialogTitle>
          <DialogDescription className="text-center">O que você pretende fazer?</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-32 gap-3 hover:bg-accent bg-transparent"
            onClick={() => onSelect("candidate")}
          >
            <Briefcase className="h-10 w-10" />
            <div className="text-center">
              <p className="font-semibold text-base">Ver vagas na minha cidade</p>
              <p className="text-xs text-muted-foreground mt-1">Encontrar oportunidades de trabalho</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-32 gap-3 hover:bg-accent bg-transparent"
            onClick={() => onSelect("recruiter")}
          >
            <Building className="h-10 w-10" />
            <div className="text-center">
              <p className="font-semibold text-base">Postar vagas</p>
              <p className="text-xs text-muted-foreground mt-1">Divulgar oportunidades de trabalho</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
