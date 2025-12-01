"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Smartphone, ArrowLeft, CheckCircle } from "lucide-react"
import Image from "next/image"
import { generateUsernameFromPhone } from "@/utils/username-generator"

export default function ConfirmPhonePage() {
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserPhone = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Buscar telefone do perfil
          const { data: profile } = await supabase.from("profiles").select("whatsapp").eq("id", user.id).single()

          if (profile?.whatsapp) {
            setPhone(profile.whatsapp)
          }
        }
      } catch (err) {
        console.error("Erro ao carregar telefone:", err)
      }
    }

    loadUserPhone()
  }, [supabase])

  const handleSendCode = async () => {
    if (!phone || phone.length < 10) {
      setError("Por favor, insira um número de telefone válido")
      return
    }

    setIsSending(true)
    setError("")
    setMessage("")

    try {
      // Formatar telefone para formato internacional (+55...)
      const formattedPhone = phone.startsWith("+") ? phone : `+55${phone.replace(/\D/g, "")}`

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (error) {
        setError(error.message || "Erro ao enviar código. Tente novamente.")
      } else {
        setMessage("Código enviado com sucesso! Verifique seu SMS.")
        setStep("code")
      }
    } catch (err) {
      setError("Erro ao enviar código. Tente novamente.")
    } finally {
      setIsSending(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError("Por favor, insira o código de 6 dígitos")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+55${phone.replace(/\D/g, "")}`

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: "sms",
      })

      if (error) {
        setError(error.message || "Código inválido. Tente novamente.")
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          // Verificar se já existe perfil
          const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

          if (!existingProfile) {
            // Gerar username baseado no telefone
            const username = await generateUsernameFromPhone(formattedPhone)

            // Criar perfil com username gerado
            await supabase.from("profiles").insert({
              id: user.id,
              username: username,
              whatsapp: formattedPhone,
              user_type: "candidate",
              created_at: new Date().toISOString(),
            })
          }
        }

        setMessage("Telefone confirmado com sucesso!")
        setTimeout(() => {
          router.push("/onboarding")
        }, 1500)
      }
    } catch (err) {
      console.error("[v0] Erro ao verificar código:", err)
      setError("Erro ao verificar código. Tente novamente.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBack = () => {
    if (step === "code") {
      setStep("phone")
      setCode("")
      setError("")
      setMessage("")
    } else {
      router.push("/confirm-email")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
          </div>

          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {step === "phone" ? "Confirme seu telefone" : "Digite o código"}
            </h1>
            <p className="text-muted-foreground">
              {step === "phone"
                ? "Enviaremos um código de verificação via SMS"
                : "Insira o código de 6 dígitos que enviamos"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {step === "phone" ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Número de telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Formato: DDD + número (ex: 11987654321)</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSendCode} disabled={isSending} className="w-full">
                {isSending ? "Enviando..." : "Enviar código"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Código enviado para: <strong>{phone}</strong>
                </p>
              </div>

              <div>
                <Label htmlFor="code">Código de verificação</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="mt-1 text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert>
                  <CheckCircle className="w-4 h-4 mr-2 inline" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleVerifyCode} disabled={isVerifying} className="w-full">
                {isVerifying ? "Verificando..." : "Confirmar código"}
              </Button>

              <Button onClick={handleSendCode} variant="ghost" className="w-full" disabled={isSending}>
                {isSending ? "Reenviando..." : "Reenviar código"}
              </Button>
            </div>
          )}

          <Button onClick={handleBack} variant="outline" className="w-full bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            O código expira em 60 segundos. Não recebeu?{" "}
            <button
              onClick={() => setStep("phone")}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Tente novamente
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
