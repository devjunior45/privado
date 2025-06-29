"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function LoginPrompt() {
  const router = useRouter()

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="text-center space-y-2">
          <p className="font-medium">Crie sua conta para anunciar ou se candidatar a uma vaga</p>
          <p className="text-sm text-muted-foreground">
            Acesse todas as funcionalidades e encontre as melhores oportunidades
          </p>
          <Button onClick={() => router.push("/")} className="mt-2">
            Criar Conta ou Entrar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
