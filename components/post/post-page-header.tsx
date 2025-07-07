"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function PostPageClientHeader() {
  const router = useRouter()

  const handleBack = () => {
    // Verifica se a página de referência (de onde o usuário veio) é do mesmo site.
    // Se for, usa a função de voltar do navegador.
    if (document.referrer && new URL(document.referrer).origin === window.location.origin) {
      router.back()
    } else {
      // Se o usuário acessou o link diretamente (sem referência interna),
      // o botão o levará para o feed.
      router.push("/feed")
    }
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
