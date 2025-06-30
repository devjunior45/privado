import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "@/components/navigation"
import { Header } from "@/components/header"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Galeria de Empregos",
  description: "Encontre as melhores oportunidades de emprego na sua região.",
  applicationName: "Galeria de Empregos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Galeria de Empregos",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    apple: [{ url: "/icon-192x192.png" }],
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let userProfileData = null
  if (authUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("city_id, full_name, username, user_type")
      .eq("id", authUser.id)
      .single()
    userProfileData = profile
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* O Next.js gerencia as tags <link rel="manifest"> e <meta name="theme-color"> a partir dos exports `metadata` e `viewport` */}
      </head>
      <body className={`${inter.className} bg-background text-foreground transition-colors duration-300`}>
        <Navigation isLoggedIn={!!authUser} userProfile={userProfileData} />
        <main className="pb-20 md:pb-0 md:ml-64">
          {authUser && userProfileData && (
            <div className="hidden md:block sticky top-0 z-40 bg-background shadow-sm border-b">
              <Header user={{ username: userProfileData.username, full_name: userProfileData.full_name }} />
            </div>
          )}
          <div className="w-full">{children}</div>
        </main>
        <PWAInstallPrompt />

        {/* SCRIPT DE REGISTRO DO SERVICE WORKER - ESSENCIAL PARA PWA */}
        <script
          id="service-worker-registration"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('Service Worker registrado com sucesso. Escopo: ', registration.scope);
                    })
                    .catch(function(error) {
                      console.error('Falha ao registrar o Service Worker: ', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
