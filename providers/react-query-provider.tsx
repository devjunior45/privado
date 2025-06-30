"use client"

import { useState } from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { ReactNode } from "react"

interface ReactQueryProviderProps {
  children: ReactNode
}

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Ensure a single QueryClient instance
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
