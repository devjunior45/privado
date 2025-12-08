import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClientLayout } from "@/app/client-layout" // Import the client layout

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Galeria de Empregos",
  description: "Encontre as melhores oportunidades de trabalho",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
