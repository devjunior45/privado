import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"
import { createClient } from "@/lib/supabase/server"
import { DesktopHeader } from "@/components/desktop-header"
import { ProfileSidebar } from "@/components/profile-sidebar"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ProfileCompletionProvider } from "@/components/auth/profile-completion-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Galeria de Empregos",
  description: "Encontre as melhores oportunidades de trabalho",
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

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <ProfileCompletionProvider>
              {/* Mobile Layout */}
              <div className="md:hidden">
                {children}
                <Navigation />
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block h-screen overflow-hidden">
                <DesktopHeader user={user} profile={profile} />
                <div className="flex h-[calc(100vh-56px)] max-w-6xl mx-auto px-4">
                  {/* Sidebar Esquerda - Perfil */}
                  <aside className="w-64 flex-shrink-0 h-full overflow-hidden">
                    <ProfileSidebar user={user} profile={profile} />
                  </aside>

                  {/* Conteúdo Central */}
                  <main className="flex-1 overflow-y-auto px-6">{children}</main>
                </div>
              </div>

              <Toaster />
            </ProfileCompletionProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
