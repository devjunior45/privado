"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, MessageCircle } from "lucide-react"

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  const whatsappLink = "https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20assinar%20o%20Busca%20Empregos%2B"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Limite de Vagas Atingido
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Você atingiu o limite de <strong>1 vaga ativa</strong> para contas não verificadas.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">✨ Busca Empregos+</p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Vagas ilimitadas</li>
                <li>• Prioridade no feed</li>
                <li>• Selo de verificação</li>
                <li>• Suporte dedicado</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => window.open(whatsappLink, "_blank")} className="w-full gap-2">
            <MessageCircle className="w-4 h-4" />
            Assinar Busca Empregos+
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
