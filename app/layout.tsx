import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { DesktopHeader } from "@/components/desktop-header"
import { ProfileSidebar } from "@/components/profile-sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Galeria de Empregos",
  description: "Encontre as melhores oportunidades de trabalho",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    userProfile = profile
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <div className="min-h-screen bg-background">
              {/* Mobile Navigation - unchanged */}
              <div className="md:hidden">
                <Navigation isLoggedIn={!!user} userProfile={userProfile} />
                <main className="pb-16">{children}</main>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <DesktopHeader isLoggedIn={!!user} userProfile={userProfile} />
                <div className="pt-14">
                  <div className="max-w-6xl mx-auto flex">
                    <ProfileSidebar isLoggedIn={!!user} userProfile={userProfile} />
                    <main className="flex-1 px-6 py-6 max-w-3xl">{children}</main>
                  </div>
                </div>
              </div>

              <PWAInstallPrompt />
            </div>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
