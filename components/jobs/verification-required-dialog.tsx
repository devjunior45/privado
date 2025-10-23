"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface VerificationRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerificationRequiredDialog({ open, onOpenChange }: VerificationRequiredDialogProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-yellow-500" />
            <DialogTitle>Verificação Necessária</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3">
            <p>
              Você atingiu o limite de <strong>1 vaga ativa</strong> para contas não verificadas.
            </p>
            <p>
              Para publicar vagas ilimitadas e ter acesso a recursos exclusivos, complete o processo de verificação da
              sua empresa.
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg mt-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Benefícios da Verificação:</p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
                <li>Vagas ilimitadas</li>
                <li>Selo de empresa verificada</li>
                <li>Maior credibilidade</li>
                <li>Prioridade nos resultados</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              router.push("/settings?tab=verification")
            }}
            className="w-full sm:w-auto"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Solicitar Verificação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
