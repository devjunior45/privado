import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { createClient } from "@/lib/supabase/server"
import { DesktopHeader } from "@/components/desktop-header"
import { ProfileSidebar } from "@/components/profile-sidebar"
import { ProfileCompletionCheck } from "@/components/auth/profile-completion-check"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Galeria de Empregos",
  description: "Encontre as melhores oportunidades de emprego",
    generator: 'v0.app'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
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
            <ProfileCompletionCheck />
            <div className="flex flex-col md:h-screen md:overflow-hidden">
              {/* Header Desktop */}
              <DesktopHeader user={user} profile={profile} />

              {/* Container principal */}
              <div className="flex-1 md:flex md:h-full md:overflow-hidden">
                {/* Sidebar Desktop - Perfil do usuário */}
                <ProfileSidebar user={user} profile={profile} />

                {/* Conteúdo principal */}
                <main className="flex-1 md:overflow-y-auto pb-16 md:pb-0">
                  <div className="max-w-3xl mx-auto px-4 py-6">{children}</div>
                </main>
              </div>

              {/* Navegação Mobile */}
              <Navigation />
            </div>
            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
