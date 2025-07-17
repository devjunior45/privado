"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setMessage("Verifique seu e-mail para redefinir sua senha.")
    } catch (error: any) {
      console.error("Erro ao enviar email de recuperação:", error)
      setError(error.message || "Erro ao enviar email de recuperação")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="absolute left-4 top-4">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="mb-6">
            <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Esqueceu sua senha?</h1>
          <p className="text-muted-foreground">Digite seu e-mail e enviaremos um link para redefinir sua senha</p>
        </div>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <Mail className="h-4 w-4" />
            <AlertDescription className="text-green-800 dark:text-green-200">{message}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Lembrou da senha?{" "}
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
