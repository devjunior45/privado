"use client"

import type React from "react"
import useMobile from "@/hooks/use-mobile"

interface PageContainerProps {
  children: React.ReactNode
  header?: React.ReactNode
  className?: string
}

export function PageContainer({ children, header, className = "" }: PageContainerProps) {
  const isMobile = useMobile()

  if (isMobile) {
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        {header}
        <div className="px-4">{children}</div>
      </div>
    )
  }

  // Desktop - conteúdo já está dentro do layout correto
  return <div className={className}>{children}</div>
}
