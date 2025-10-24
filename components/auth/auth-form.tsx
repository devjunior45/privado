"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, ArrowLeft, MapPin, Users, Eye } from "lucide-react"
import type { UserType } from "@/types/profile"
import { CitySelect } from "@/components/ui/city-select"
import Image from "next/image"
import { GoogleIcon } from "@/components/icons/google-icon"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useMobile } from "@/hooks/use-mobile"
import { generateUniqueUsername } from "@/utils/username-generator"

type AuthStep = "welcome" | "login" | "user-type" | "city-selection" | "personal-info" | "company-info"

export function AuthForm() {
  const [currentStep, setCurrentStep] = useState<AuthStep>("welcome")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [companyLocation, setCompanyLocation] = useState("")
  const [userType, setUserType] = useState<UserType>("candidate")
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
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

    const errorParam = searchParams.get("error")
    if (errorParam) {
      setError(errorParam)
    }
  }, [searchParams])

  const getLogoSrc = () => {
    if (isMobile) {
      return theme === "dark" ? "/temaescuro.png" : "/temaclaro.png"
    }
    return "/logo.empresa.png"
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validar se as senhas coincidem
    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    // Validar tamanho mínimo da senha
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Gerar username único baseado no nome
      const username = await generateUniqueUsername(fullName)

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            user_type: userType,
            city_id: selectedCityId?.toString(),
            company_name: userType === "recruiter" ? companyName : null,
            company_location: userType === "recruiter" ? companyLocation : null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        console.error("Erro ao criar usuário:", signUpError)
        throw signUpError
      }

      if (!data.user) {
        throw new Error("Usuário não foi criado")
      }

      // Salvar email no localStorage para a página de confirmação
      localStorage.setItem("pending_confirmation_email", email)

      // Aguarda um pouco para o trigger criar o perfil
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Verifica se o perfil foi criado
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single()

      if (profileError || !profile) {
        console.error("Perfil não foi criado automaticamente, criando manualmente...")

        // Tenta criar o perfil manualmente se o trigger falhou
        const { error: insertError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: email,
          username: username,
          full_name: fullName,
          user_type: userType,
          city_id: selectedCityId,
          company_name: userType === "recruiter" ? companyName : null,
          company_location: userType === "recruiter" ? companyLocation : null,
        })

        if (insertError) {
          console.error("Erro ao criar perfil manualmente:", insertError)
          throw new Error("Erro ao criar perfil: " + insertError.message)
        }
      }

      // Redirecionar para confirmação de email
      router.push("/confirm-email")
      router.refresh()
    } catch (error: any) {
      console.error("Erro no cadastro:", error)
      setError(error.message || "Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      router.push("/feed")
      router.refresh()
    } catch (error: any) {
      console.error("Erro no login:", error)
      setError(error.message || "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInWithGoogle = async () => {
    setIsGoogleLoading(true)
    setError("")

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setIsGoogleLoading(false)
      }
    } catch (error: any) {
      setError("Erro ao conectar com o Google")
      setIsGoogleLoading(false)
    }
  }

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type)
    setCurrentStep("city-selection")
  }

  const handleCityNext = () => {
    if (userType === "recruiter") {
      setCurrentStep("company-info")
    } else {
      setCurrentStep("personal-info")
    }
  }

  const renderWelcomeStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mb-6"> <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" /> </div>
        <p className="text-muted-foreground">Conectando talentos e oportunidades</p>
      </div>

      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium mb-2">Bem-vindo!</h3>
          <p className="text-muted-foreground">Como você gostaria de continuar?</p>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSignInWithGoogle}
          className="w-full h-12 bg-transparent"
          variant="outline"
          disabled={isGoogleLoading}
        >
          <GoogleIcon className="mr-2 h-5 w-5" />
          {isGoogleLoading ? "Conectando..." : "Entrar com Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou</span>
          </div>
        </div>

        <Button onClick={() => setCurrentStep("login")} className="w-full h-12" variant="default">
          Entrar com email
        </Button>

        <Button onClick={() => setCurrentStep("user-type")} className="w-full h-12" variant="outline">
          Quero criar uma conta
        </Button>
      </div>
    </div>
  )

  const renderLoginStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("welcome")} className="absolute left-4 top-4">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="mb-6"> <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" /> </div>
        <h2 className="text-2xl font-bold">Entrar</h2>
        <p className="text-muted-foreground">Acesse sua conta com seu email</p>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <Label htmlFor="signin-email">Email</Label>
          <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="signin-password">Senha</Label>
          <Input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  )

  const renderUserTypeStep = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep("welcome")} className="absolute left-4 top-4">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="mb-6"> <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" /> </div>
        <h2 className="text-2xl font-bold">Criar Conta</h2>
        <p className="text-muted-foreground">O que você pretende fazer?</p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => handleUserTypeSelect("candidate")}
          className="w-full h-20 flex flex-col items-center justify-center gap-2"
          variant="outline"
        >
          <Eye className="w-6 h-6" />
          <div className="text-center">
            <p className="font-medium">Ver vagas na minha cidade</p>
            <p className="text-xs text-muted-foreground">Encontrar oportunidades de trabalho</p>
          </div>
        </Button>

        <Button
          onClick={() => handleUserTypeSelect("recruiter")}
          className="w-full h-20 flex flex-col items-center justify-center gap-2"
          variant="outline"
        >
          <Building className="w-6 h-6" />
          <div className="text-center">
            <p className="font-medium">Postar vagas</p>
            <p className="text-xs text-muted-foreground">Divulgar oportunidades de trabalho</p>
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
        <div className="mb-6"> <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" /> </div>
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <MapPin className="w-6 h-6" />
          Sua Cidade
        </h2>
        <p className="text-muted-foreground">
          {userType === "candidate"
            ? "Escolha sua cidade para ver vagas próximas"
            : "Escolha sua cidade base para suas vagas"}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Não se preocupe!</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Você poderá {userType === "candidate" ? "ver vagas" : "postar vagas"} em outras cidades também. Esta é
                apenas sua cidade principal.
              </p>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="city-select">Selecione sua cidade</Label>
          <CitySelect
            value={selectedCityId}
            onValueChange={setSelectedCityId}
            placeholder="Escolha sua cidade"
            className="w-full"
          />
        </div>

        <Button onClick={handleCityNext} className="w-full" disabled={!selectedCityId}>
          Continuar
        </Button>
      </div>
    </div>
  )

  const renderPersonalInfoStep = () => (
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
        <div className="mb-6"> <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" /> </div>
        <h2 className="text-2xl font-bold">Seus Dados</h2>
        <p className="text-muted-foreground">Finalize seu cadastro</p>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <Label htmlFor="signup-fullName">Nome Completo</Label>
          <Input id="signup-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="signup-password">Senha</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <Label htmlFor="signup-confirmPassword">Confirmar Senha</Label>
          <Input
            id="signup-confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Digite a senha novamente"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
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
        <div className="mb-6"> <Image src="/logo.empresa.png" alt="Logo" width={200} height={80} className="mx-auto" /> </div>
        <h2 className="text-2xl font-bold">Dados da Empresa</h2>
        <p className="text-muted-foreground">Finalize seu cadastro</p>
      </div>

      {error && (
        <Alert className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <Label htmlFor="signup-fullName">Nome do Responsável</Label>
          <Input id="signup-fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="signup-companyName">Nome da Empresa</Label>
          <Input
            id="signup-companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="signup-companyLocation">Localização da Empresa</Label>
          <Input
            id="signup-companyLocation"
            value={companyLocation}
            onChange={(e) => setCompanyLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="signup-password">Senha</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <Label htmlFor="signup-confirmPassword">Confirmar Senha</Label>
          <Input
            id="signup-confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Digite a senha novamente"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "welcome":
        return renderWelcomeStep()
      case "login":
        return renderLoginStep()
      case "user-type":
        return renderUserTypeStep()
      case "city-selection":
        return renderCitySelectionStep()
      case "personal-info":
        return renderPersonalInfoStep()
      case "company-info":
        return renderCompanyInfoStep()
      default:
        return renderWelcomeStep()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative">
      {renderCurrentStep()}
    </div>
  )
}
