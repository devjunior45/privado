"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, RefreshCw } from "lucide-react"
import Image from "next/image"

export default function ConfirmEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verificar se há um usuário logado mas não confirmado
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")

        // Se o email já foi confirmado, redirecionar para o feed
        if (user.email_confirmed_at) {
          router.push("/feed")
          return
        }
      } else {
        // Se não há usuário, redirecionar para login
        router.push("/login")
        return
      }
    }

    checkUser()

    // Escutar mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        // Email confirmado, redirecionar para o feed
        router.push("/feed")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleResendEmail = async () => {
    if (!userEmail) return

    setIsResending(true)
    setResendMessage("")

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
      })

      if (error) {
        setResendMessage("Erro ao reenviar email. Tente novamente.")
      } else {
        setResendMessage("Email reenviado com sucesso! Verifique sua caixa de entrada.")
      }
    } catch (error) {
      setResendMessage("Erro ao reenviar email. Tente novamente.")
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
          </div>

          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Confirme seu e-mail</h1>
            <p className="text-muted-foreground">Enviamos um link de confirmação para:</p>
            <p className="font-medium text-foreground mt-1">{userEmail}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">Para continuar:</p>
                <ol className="text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Verifique sua caixa de entrada</li>
                  <li>Clique no link de confirmação</li>
                  <li>Você será redirecionado automaticamente</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Não encontrou o e-mail?</strong> Verifique sua pasta de spam ou lixo eletrônico.
            </p>
          </div>

          {resendMessage && (
            <Alert>
              <AlertDescription>{resendMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full bg-transparent"
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Reenviando..." : "Reenviar e-mail"}
            </Button>

            <Button onClick={handleBackToLogin} className="w-full" variant="ghost">
              Voltar ao login
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Problemas com a confirmação?{" "}
            <button
              onClick={handleBackToLogin}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Entre em contato conosco
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
