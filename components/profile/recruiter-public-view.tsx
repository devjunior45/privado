// components/profile/recruiter-public-view.tsx
"use client"

import type { ReactNode } from "react"

interface RecruiterPublicViewProps {
  children?: ReactNode
}

/**
 * Minimal placeholder until the full implementation is restored.
 * Provides the missing named export `RecruiterPublicView`
 * and keeps a `default` export so existing imports continue to work.
 */
export function RecruiterPublicView({ children }: RecruiterPublicViewProps) {
  return (
    <div className="min-h-screen dark:bg-black bg-white flex items-center justify-center">
      {children ?? (
        <p className="text-muted-foreground">
          Componente RecruiterPublicView placeholder – substituir pela implementação real.
        </p>
      )}
    </div>
  )
}

export default RecruiterPublicView
