"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function NotFoundContent() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
        <p className="text-gray-600 mb-8">A página que você está procurando não existe ou foi movida.</p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
          {from && (
            <Button variant="outline" asChild>
              <Link href={from}>Voltar</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NotFoundPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NotFoundContent />
    </Suspense>
  )
}
