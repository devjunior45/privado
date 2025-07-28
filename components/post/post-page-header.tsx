"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function PostPageClientHeader() {
  const router = useRouter()

  const handleBack = () => {
    // Verifica se há histórico de navegação no browser
    if (window.history.length > 1) {
      // Verifica se há um referrer e se é do mesmo domínio
      if (document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer)
          const currentUrl = new URL(window.location.href)

          // Se o referrer é do mesmo domínio, volta para a página anterior
          if (referrerUrl.origin === currentUrl.origin) {
            router.back()
            return
          }
        } catch (error) {
          // Se houver erro ao processar URLs, redireciona para o feed
          router.push("/feed")
          return
        }
      } else {
        // Se não há referrer mas há histórico, ainda assim tenta voltar
        // (pode ser navegação interna sem referrer)
        router.back()
        return
      }
    }

    // Se não há histórico ou o referrer não é do mesmo domínio,
    // redireciona para o feed
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
