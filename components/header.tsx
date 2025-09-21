"use client"

import { ArrowLeft, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface HeaderProps {
  title: string
  showSettings?: boolean
  showBackButton?: boolean
  isLoggedIn: boolean
}

export function Header({ title, showSettings = false, showBackButton = false, isLoggedIn }: HeaderProps) {
  const router = useRouter()

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-0 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          {showSettings && isLoggedIn && (
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop - No header needed as it's handled by the main layout */}
      <div className="hidden md:block">{/* Desktop pages don't need individual headers */}</div>
    </>
  )
}
