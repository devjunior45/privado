import type React from "react"

interface PageContainerProps {
  header?: React.ReactNode
  children: React.ReactNode
}

export function PageContainer({ header, children }: PageContainerProps) {
  return (
    <div className="flex flex-col min-h-full">
      {" "}
      {/* Use min-h-full */}
      {header} {/* Header is now conditionally rendered in consuming pages like feed/page.tsx */}
      <div className="flex-1">
        {" "}
        {/* Removed padding, parent (main in RootLayout) handles it */}
        {children}
      </div>
    </div>
  )
}
