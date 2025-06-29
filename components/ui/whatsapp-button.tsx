"use client"

import { Button } from "@/components/ui/button"
import { Phone } from "lucide-react"

interface WhatsAppButtonProps {
  whatsapp: string
  className?: string
}

export function WhatsAppButton({ whatsapp, className }: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    const whatsappUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <Button onClick={handleWhatsAppClick} className={className} size="sm">
      <Phone className="w-4 h-4 mr-2" />
      WhatsApp
    </Button>
  )
}
