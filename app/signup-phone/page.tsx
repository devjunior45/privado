"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, ArrowLeft, MapPin, Building, Users } from "lucide-react"
import Image from "next/image"
import { CitySelect } from "@/components/ui/city-select"
import { generateUsernameFromPhone } from "@/utils/username-generator"
import type { UserType } from "@/types/profile"
import { useTheme } from "next-themes"
import { useMobile } from "@/hooks/use-mobile"

type SignupStep = "welcome" | "user-type" | "city-selection" | "phone-password" | "company-info"

export default function SignupPhonePage() {
  const [currentStep, setCurrentStep] = useState<SignupStep>("welcome")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyLocation, setCompanyLocation] = useState("")
  const [userType, setUserType] = useState<UserType>("candidate")
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const isMobile = useMobile()

  useEffect(() => {
    const type = searchParams.get("userType") as UserType | null
    if (type && (type === "candidate" || type === "recruiter")) {
      setUserType(type)
      setCurrentStep("city-selection")
    }
  }, [searchParams])

  const getLogoSrc = () => {
    if (isMobile) {
      return theme === "dark" ? "/temaescuro.png" : "/temaclaro.png"
    }
    return "/logo.empresa.png"
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setIsLoading(false)
      return
    }

    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length !== 11) {
      setError("Digite um número de telefone válido com DDD")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const formattedPhone = `+55${cleanPhone}`

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (otpError) throw otpError

      setIsVerificationSent(true)
      setError("")
    } catch (error: any) {
      console.error("Erro ao enviar código:", error)
      setError("Erro ao enviar código de verificação. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const cleanPhone = phone.replace(/\D/g, "")
    const formattedPhone = `+55${cleanPhone}`
    const supabase = createClient()

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: verificationCode,
        type: "sms",
      })

      if (verifyError) throw verifyError

      if (!data.user) {
        throw new Error("Usuário não foi autenticado")
      }

      // Atualizar senha do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError)
      }

      // Gerar username baseado no telefone
      const username = await generateUsernameFromPhone(cleanPhone)

      // Verificar se o perfil já existe
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", data.user.id).single()

      if (!existingProfile) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: username,
          full_name: fullName,
          user_type: userType,
          city_id: selectedCityId,
          whatsapp: formattedPhone,
          company_name: userType === "recruiter" ? companyName : null,
          company_location: userType === "recruiter" ? companyLocation : null,
        })

        if (profileError) {
          console.error("Erro ao criar perfil:", profileError)
          throw new Error("Erro ao criar perfil: " + profileError.message)
        }
      }

      // Redirecionar para onboarding
      router.push("/onboarding")
    } catch (error: any) {
      console.error("Erro ao verificar código:", error)
      setError("Código inválido ou expirado. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderWelcomeStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-12 flex justify-center pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <h2 className="text-3xl font-bold mb-4">Cadastro por Telefone</h2>
        <p className="text-muted-foreground mb-8">Crie sua conta usando seu número de celular</p>
      </div>

      <div className="space-y-4">
        <Button onClick={() => setCurrentStep("user-type")} className="w-full" size="lg">
          Começar
        </Button>

        <Button onClick={() => router.push("/login")} variant="ghost" className="w-full">
          Já tem conta? Faça login
        </Button>
      </div>
    </div>
  )

  const renderUserTypeStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("welcome")} className="absolute left-4 top-4">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <h2 className="text-2xl font-bold">Você é?</h2>
        <p className="text-muted-foreground">Selecione o tipo de perfil</p>
      </div>

      <div className="grid gap-4">
        <Button
          variant="outline"
          className="h-auto py-6 px-6 flex items-start gap-4 hover:border-primary hover:bg-primary/5 bg-transparent"
          onClick={() => {
            setUserType("candidate")
            setCurrentStep("city-selection")
          }}
        >
          <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div className="text-left flex-1">
            <div className="font-semibold text-base mb-1">Candidato</div>
            <div className="text-sm text-muted-foreground">Estou procurando oportunidades de emprego</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-6 px-6 flex items-start gap-4 hover:border-primary hover:bg-primary/5 bg-transparent"
          onClick={() => {
            setUserType("recruiter")
            setCurrentStep("city-selection")
          }}
        >
          <Building className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div className="text-left flex-1">
            <div className="font-semibold text-base mb-1">Recrutador</div>
            <div className="text-sm text-muted-foreground">Quero divulgar vagas e encontrar talentos</div>
          </div>
        </Button>
      </div>
    </div>
  )

  const renderCitySelectionStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("user-type")} className="absolute left-4 top-4">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Onde você está?</h2>
        <p className="text-muted-foreground">Selecione sua cidade</p>
      </div>

      <div className="space-y-4">
        <CitySelect value={selectedCityId} onChange={setSelectedCityId} />

        <Button
          onClick={() => {
            if (userType === "candidate") {
              setCurrentStep("phone-password")
            } else {
              setCurrentStep("company-info")
            }
          }}
          className="w-full"
          disabled={!selectedCityId}
        >
          Continuar
        </Button>
      </div>
    </div>
  )

  const renderPhonePasswordStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep("city-selection")}
          className="absolute left-4 top-4"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <h2 className="text-2xl font-bold">Finalize seu cadastro</h2>
        <p className="text-muted-foreground">Dados pessoais</p>
      </div>

      {error && (
        <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {!isVerificationSent ? (
        <form onSubmit={handleSendVerification} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="phone">Número de Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Digite a senha novamente"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando código..." : "Enviar código de verificação"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Código de verificação enviado para {phone}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="code">Código de Verificação</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
            {isLoading ? "Verificando..." : "Confirmar código"}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={() => setIsVerificationSent(false)}>
            Alterar número
          </Button>
        </form>
      )}
    </div>
  )

  const renderCompanyInfoStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep("city-selection")}
          className="absolute left-4 top-4"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="mb-12 flex justify-end pr-12 pt-8">
          <Image src={getLogoSrc() || "/placeholder.svg"} alt="Logo" width={200} height={80} />
        </div>
        <h2 className="text-2xl font-bold">Dados da Empresa</h2>
        <p className="text-muted-foreground">Finalize seu cadastro</p>
      </div>

      {error && (
        <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {!isVerificationSent ? (
        <form onSubmit={handleSendVerification} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nome do Responsável</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="companyLocation">Localização da Empresa</Label>
            <Input
              id="companyLocation"
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Número de Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Digite a senha novamente"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando código..." : "Enviar código de verificação"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Código de verificação enviado para {phone}
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="code">Código de Verificação</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
            {isLoading ? "Verificando..." : "Confirmar código"}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={() => setIsVerificationSent(false)}>
            Alterar número
          </Button>
        </form>
      )}
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return renderWelcomeStep()
      case "user-type":
        return renderUserTypeStep()
      case "city-selection":
        return renderCitySelectionStep()
      case "phone-password":
        return renderPhonePasswordStep()
      case "company-info":
        return renderCompanyInfoStep()
      default:
        return renderWelcomeStep()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">{renderCurrentStep()}</div>
  )
}
