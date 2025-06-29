"use client"
import { useEffect, useRef, useState } from "react"

interface UseIntersectionObserverOptions {
  threshold?: number
  triggerOnce?: boolean
  rootMargin?: string
}

export function useIntersectionObserver({
  threshold = 0.5,
  triggerOnce = true,
  rootMargin = "0px",
}: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          if (triggerOnce) {
            observer.unobserve(target)
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false)
        }
      },
      {
        threshold,
        rootMargin,
      },
    )

    observer.observe(target)

    return () => {
      observer.unobserve(target)
    }
  }, [threshold, triggerOnce, rootMargin])

  return { targetRef, isIntersecting }
}
