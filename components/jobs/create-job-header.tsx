"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateJobHeaderProps {
  title?: string
}

export function CreateJobHeader({ title = "Nova Vaga" }: CreateJobHeaderProps) {
  const router = useRouter()

  return (
    <div className="hidden md:block bg-background border-b">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </div>
    </div>
  )
}
