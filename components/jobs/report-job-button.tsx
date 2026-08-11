"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Megaphone, MegaphoneOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { reportJob, REPORT_REASONS, type ReportReason } from "@/app/actions/reports"

const DESCRIPTION_MAX_LENGTH = 80

interface ReportJobButtonProps {
  jobId: string
  isLoggedIn: boolean
  isReportedInitially?: boolean
}

export function ReportJobButton({ jobId, isLoggedIn, isReportedInitially = false }: ReportJobButtonProps) {
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()

  const [isReported, setIsReported] = useState(isReportedInitially)
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState<ReportReason | "">("")
  const [customDescription, setCustomDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canProceed = selectedReason !== "" && (selectedReason !== "Outro" || customDescription.trim().length > 0)

  const resetForm = () => {
    setSelectedReason("")
    setCustomDescription("")
  }

  const handleOpenReasonDialog = () => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    if (isReported) return
    setIsReasonDialogOpen(true)
  }

  const handleProceedToConfirm = () => {
    if (!canProceed) return
    setIsReasonDialogOpen(false)
    setIsConfirmDialogOpen(true)
  }

  const handleConfirmReport = async () => {
    if (!selectedReason) return
    setIsSubmitting(true)
    try {
      const result = await reportJob(jobId, selectedReason, selectedReason === "Outro" ? customDescription : undefined)

      if (result.success) {
        setIsReported(true)
        setIsConfirmDialogOpen(false)
        resetForm()
        showToast("Obrigado por ajudar a tornar esse ambiente mais seguro.", "success")
      } else if (result.alreadyReported) {
        setIsReported(true)
        setIsConfirmDialogOpen(false)
        resetForm()
        showToast(result.error || "Você já denunciou esta vaga.", "error")
      } else {
        showToast(result.error || "Erro ao enviar denúncia. Tente novamente.", "error")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleOpenReasonDialog}
        disabled={isReported}
        title={isReported ? "Você já denunciou esta vaga" : "Denunciar vaga"}
        aria-label={isReported ? "Você já denunciou esta vaga" : "Denunciar vaga"}
        className="h-7 w-7 text-muted-foreground hover:text-destructive disabled:opacity-60"
      >
        <MegaphoneOff className="h-4 w-4" />
      </Button>

      {/* Dialog de seleção de motivo */}
      <Dialog
        open={isReasonDialogOpen}
        onOpenChange={(open) => {
          setIsReasonDialogOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informe o motivo da denúncia</DialogTitle>
            <DialogDescription>Selecione a opção que melhor descreve o problema com esta vaga.</DialogDescription>
          </DialogHeader>

          <RadioGroup value={selectedReason} onValueChange={(value) => setSelectedReason(value as ReportReason)}>
            <div className="space-y-3">
              {REPORT_REASONS.map((reason) => (
                <div key={reason} className="flex items-center gap-2">
                  <RadioGroupItem value={reason} id={`reason-${reason}`} />
                  <Label htmlFor={`reason-${reason}`} className="font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {selectedReason === "Outro" && (
            <div className="space-y-1">
              <Textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
                placeholder="Descreva o motivo da denúncia"
                maxLength={DESCRIPTION_MAX_LENGTH}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {customDescription.length}/{DESCRIPTION_MAX_LENGTH}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReasonDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleProceedToConfirm} disabled={!canProceed} variant="destructive">
              Denunciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-destructive" />
              Deseja realmente denunciar a vaga?
            </DialogTitle>
            <DialogDescription>Essa ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmReport} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastContainer />
    </>
  )
}
