"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { DesktopHeader } from "@/components/desktop-header"
import { ProfileSidebar } from "@/components/profile-sidebar"
import { ProfileCheckWrapper } from "@/components/profile/profile-check-wrapper"
import { useEffect } from "react"

// Componente de proteção global contra travamento do Radix
function RadixPointerEventsProtection() {
  useEffect(() => {
    // MutationObserver para detectar quando o body fica bloqueado
    const observer = new MutationObserver(() => {
      if (document.body.style.pointerEvents === "none") {
        console.warn("[v0] Radix deixou pointer-events:none no body. Restaurando...")
        document.body.style.pointerEvents = "auto"
      }
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    })

    // Limpeza a cada 1 segundo como fallback
    const interval = setInterval(() => {
      if (document.body.style.pointerEvents === "none") {
        console.warn("[v0] Limpeza de fallback: restaurando pointer-events")
        document.body.style.pointerEvents = "auto"
      }
    }, 1000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return null
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  // The original layout.tsx was an async server component.
  // To keep the same functionality, we need to fetch user data here.
  // However, "use client" prevents direct server-side data fetching.
  // For this refactor, we'll assume user data is fetched in a parent server component
  // or a context provider that's accessible here.
  // For demonstration purposes, we'll use dummy data or placeholder.
  // In a real application, you'd likely use a hook or context to get user info.

  // Placeholder for user data fetching. This part would ideally be handled
  // by a server component that passes data down or a client-side hook
  // that fetches data from an API route.
  const user = null // Replace with actual user fetching logic
  const userProfile = null // Replace with actual user profile fetching logic

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ReactQueryProvider>
        {/* Adicionar proteção global contra travamento do Radix */}
        <RadixPointerEventsProtection />
        <ProfileCheckWrapper userProfile={userProfile}>
          <div className="min-h-screen bg-background">
            {/* Mobile Navigation - unchanged */}
            <div className="md:hidden">
              <Navigation isLoggedIn={!!user} userProfile={userProfile} />
              <main className="pb-16">{children}</main>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block h-screen overflow-hidden">
              <DesktopHeader isLoggedIn={!!user} userProfile={userProfile} />
              <div className="h-full pt-14">
                <div className="max-w-6xl mx-auto flex h-full">
                  <ProfileSidebar isLoggedIn={!!user} userProfile={userProfile} />
                  <main className="flex-1 px-6 py-6 max-w-3xl overflow-y-auto">{children}</main>
                </div>
              </div>
            </div>

            <PWAInstallPrompt />
          </div>
        </ProfileCheckWrapper>
      </ReactQueryProvider>
    </ThemeProvider>
  )
}

export default ClientLayout
