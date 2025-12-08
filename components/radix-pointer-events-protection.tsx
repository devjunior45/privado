"use client"

import { useEffect } from "react"

/**
 * Proteção global contra bug do Radix UI onde pointer-events: none
 * fica travado no body após fechar modais durante ações async.
 *
 * Este componente monitora continuamente o body e restaura pointer-events
 * caso detecte que está bloqueado incorretamente.
 */
export function RadixPointerEventsProtection() {
  useEffect(() => {
    // MutationObserver para detectar quando o body tem pointer-events alterado
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "style") {
          const body = document.body
          const pointerEvents = window.getComputedStyle(body).pointerEvents

          // Se pointer-events estiver como "none", restaurar para "auto"
          if (pointerEvents === "none") {
            console.log("[v0] Radix bug detectado: pointer-events bloqueado. Restaurando...")
            body.style.pointerEvents = "auto"
          }
        }
      })
    })

    // Observar mudanças no atributo style do body
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    })

    // Verificação periódica adicional como fallback
    const intervalId = setInterval(() => {
      const body = document.body
      const pointerEvents = window.getComputedStyle(body).pointerEvents

      if (pointerEvents === "none") {
        console.log("[v0] Radix bug detectado (interval): pointer-events bloqueado. Restaurando...")
        body.style.pointerEvents = "auto"
      }
    }, 500)

    // Cleanup
    return () => {
      observer.disconnect()
      clearInterval(intervalId)
    }
  }, [])

  return null
}
