"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { generateResumePDF } from "@/utils/generate-pdf"
import type { UserProfile } from "@/types/profile"

interface ResumePDFProps {
  profile: UserProfile
}

export function ResumePDF({ profile }: ResumePDFProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      // Verificar se o perfil tem dados mínimos necessários
      if (!profile.username && !profile.full_name) {
        throw new Error("Perfil incompleto para gerar PDF")
      }

      const pdfDataUrl = await generateResumePDF(profile)

      // Verificar se o PDF foi gerado com sucesso
      if (!pdfDataUrl || !pdfDataUrl.startsWith("data:application/pdf")) {
        throw new Error("Erro na geração do PDF")
      }

      // Criar um link para download
      const link = document.createElement("a")
      link.href = pdfDataUrl
      const now = new Date()
      const dateStr = now.toLocaleDateString("pt-BR").replace(/\//g, "-")
      const timeStr = now.toLocaleTimeString("pt-BR", { hour12: false }).replace(/:/g, "-")
      const fileName = `${profile.full_name || profile.username || "usuario"}-${dateStr}-${timeStr}.pdf`
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente ou verifique se todos os campos estão preenchidos corretamente.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleGeneratePDF} disabled={isGenerating} variant="outline" className="w-full bg-transparent">
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Baixar Currículo PDF
        </>
      )}
    </Button>
  )
}
