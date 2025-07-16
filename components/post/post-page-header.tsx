"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function PostPageClientHeader() {
  const router = useRouter()

  const handleBack = () => {
    // Verifica se há histórico de navegação e se a página anterior é do mesmo domínio
    if (window.history.length > 1 && document.referrer) {
      const referrerUrl = new URL(document.referrer)
      const currentUrl = new URL(window.location.href)

      // Se o referrer é do mesmo domínio, volta para a página anterior
      if (referrerUrl.origin === currentUrl.origin) {
        router.back()
        return
      }
    }

    // Se não há referrer interno ou o usuário chegou diretamente, vai para o feed
    router.push("/feed")
  }

  return (
    <div className="bg-white dark:bg-black border-b sticky top-0 z-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-semibold text-lg">Vaga</h1>
      </div>
    </div>
  )
}
