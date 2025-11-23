"use client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SettingsSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleOpenSettings = () => {
    setIsOpen(false)
    router.push("/settings")
  }

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="p-2">
         <Settings className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle className="text-center">Menu</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <Button
              variant="outline"
              onClick={handleOpenSettings}
              className="w-full justify-start text-left h-12 bg-transparent"
            >
              {/* Settings icon removed */}
              Configurações
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
