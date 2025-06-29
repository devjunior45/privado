"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Briefcase, Building } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserTypeDialog({ open, onOpenChange }: UserTypeDialogProps) {
  const router = useRouter()

  const handleUserTypeSelect = (type: "candidate" | "recruiter") => {
    router.push(`/?userType=${type}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">O que você deseja fazer?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-32 gap-2"
            onClick={() => handleUserTypeSelect("candidate")}
          >
            <Briefcase className="h-8 w-8" />
            <div className="text-center">
              <p className="font-medium">Candidato</p>
              <p className="text-xs text-muted-foreground">Quero me candidatar a vagas</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-32 gap-2"
            onClick={() => handleUserTypeSelect("recruiter")}
          >
            <Building className="h-8 w-8" />
            <div className="text-center">
              <p className="font-medium">Anunciante</p>
              <p className="text-xs text-muted-foreground">Quero divulgar vagas</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
