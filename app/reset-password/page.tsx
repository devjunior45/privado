"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Verificar se há uma sessão válida para redefinição de senha
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        setError("Link de redefinição inválido ou expirado. Solicite um novo link.")
      }
    }

    checkSession()

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setMessage("Senha atualizada com sucesso. Faça login novamente.")

      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      console.error("Erro ao atualizar senha:", error)
      setError(error.message || "Erro ao atualizar senha")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidSession && !error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto text-center">
          <div className="mb-6">
            <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
          </div>
          <p className="text-muted-foreground">Verificando link de redefinição...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Defina sua nova senha</h1>
          <p className="text-muted-foreground">Digite sua nova senha para acessar sua conta</p>
        </div>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-200">{message}</AlertDescription>
          </Alert>
        )}

        {isValidSession && !message && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Atualizando..." : "Atualizar senha"}
            </Button>
          </form>
        )}

        {!isValidSession && (
          <div className="text-center mt-6">
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full bg-transparent">
                Solicitar novo link
              </Button>
            </Link>
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
