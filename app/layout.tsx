import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { Toaster } from "@/components/ui/toaster"
import { ReactQueryProvider } from "@/providers/react-query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { DesktopHeader } from "@/components/desktop-header"
import { ProfileSidebar } from "@/components/profile-sidebar"
import { ProfileCompletionCheck } from "@/components/auth/profile-completion-check"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Galeria de Empregos",
  description: "Encontre as melhores oportunidades de trabalho",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            {/* Desktop Layout */}
            <div className="hidden md:block h-screen overflow-hidden">
              <DesktopHeader />
              <div className="flex h-[calc(100vh-3.5rem)] max-w-6xl mx-auto">
                <ProfileSidebar />
                <main className="flex-1 overflow-y-auto">{children}</main>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden min-h-screen pb-16">
              {children}
              <Navigation />
            </div>

            {/* Profile Completion Check */}
            <ProfileCompletionCheck />

            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
