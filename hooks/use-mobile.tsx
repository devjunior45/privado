"use client" // Ensure this is a client component

import { useState, useEffect } from "react"

const useMobile = (query = "(max-width: 767px)") => {
  // Initialize state to a default value or undefined if server-side rendering
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches
    }
    return false // Default for SSR, or true if mobile-first is preferred
  })

  useEffect(() => {
    // Ensure this effect runs only on the client
    if (typeof window === "undefined") {
      return
    }

    const mediaQueryList = window.matchMedia(query)
    const listener = () => setMatches(mediaQueryList.matches)

    // Call listener once to set initial state correctly on client
    listener()

    mediaQueryList.addEventListener("change", listener)
    return () => mediaQueryList.removeEventListener("change", listener)
  }, [query])

  return matches
}

export default useMobile
export { useMobile } // ← enables `import { useMobile } from "@/hooks/use-mobile"`
