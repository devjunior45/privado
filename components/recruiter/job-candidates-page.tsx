// components/recruiter/job-candidates-page.tsx
"use client"

import type { ReactNode } from "react"

interface JobCandidatesPageProps {
  children?: ReactNode
}

/**
 * Placeholder component that fulfils the required named export.
 * Replace with the actual job-candidates page logic when available.
 */
export function JobCandidatesPage({ children }: JobCandidatesPageProps) {
  return (
    <main className="min-h-screen dark:bg-black bg-white flex items-center justify-center">
      {children ?? (
        <p className="text-muted-foreground">
          Componente JobCandidatesPage placeholder – substituir pela implementação real.
        </p>
      )}
    </main>
  )
}

export default JobCandidatesPage
