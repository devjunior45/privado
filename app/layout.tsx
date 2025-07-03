import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Galeria de Empregos",
  description: "Encontre as melhores oportunidades de trabalho",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    generator: 'v0.dev'
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
              <Navigation isLoggedIn={!!user} userProfile={userProfile} />
              <main className="md:ml-64 pb-16 md:pb-0">{children}</main>
              <PWAInstallPrompt />
            </div>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
