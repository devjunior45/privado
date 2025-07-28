"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsSheet } from "@/components/ui/settings-sheet"
import { SettingsDropdown } from "@/components/ui/settings-dropdown"

interface HeaderProps {
  title?: string
  showSettings?: boolean
  isLoggedIn?: boolean
  showBackButton?: boolean
}

export function Header({ title, showSettings = false, isLoggedIn = false, showBackButton = false }: HeaderProps) {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile Header */}
      <div className="container relative flex h-14 items-center justify-between md:hidden">
        {/* Left side - Back button or placeholder */}
        <div className="w-10">
          {showBackButton && (
            <Button variant="ghost" size="sm" className="p-2" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Centered Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-lg font-semibold whitespace-nowrap">{title}</h1>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center justify-end">{isLoggedIn && showSettings && <SettingsSheet />}</div>
      </div>

      {/* Desktop Header */}
      <div className="container hidden h-14 items-center md:flex">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button variant="ghost" size="sm" className="p-2" onClick={handleBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <Link href="/feed" className="flex items-center space-x-2">
              <img src="/logo.empresa.svg" alt="Logo" className="h-6 w-auto" />
            </Link>
          </div>
          <nav className="flex items-center space-x-4">{isLoggedIn && showSettings && <SettingsDropdown />}</nav>
        </div>
      </div>
    </header>
  )
}
