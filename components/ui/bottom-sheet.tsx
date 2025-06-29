"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  className?: string
}

export function BottomSheet({ isOpen, onClose, children, title, className = "" }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      document.body.style.overflow = "hidden"

      // Adicionar classe ao body para ajustar em dispositivos móveis
      document.body.classList.add("bottom-sheet-open")
    } else {
      document.body.style.overflow = "unset"
      document.body.classList.remove("bottom-sheet-open")
    }

    return () => {
      document.body.style.overflow = "unset"
      document.body.classList.remove("bottom-sheet-open")
    }
  }, [isOpen])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setStartY(touch.clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sheetRef.current) return

    const touch = e.touches[0]
    const deltaY = touch.clientY - startY

    // Só permitir arrastar para baixo
    if (deltaY < 0) {
      sheetRef.current.style.transform = "translateY(0)"
      return
    }

    // Aplicar resistência ao arrastar
    const resistance = 0.4
    const translateY = deltaY * resistance

    setCurrentY(translateY)

    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${translateY}px)`
    }

    // Ajustar opacidade do backdrop
    if (backdropRef.current) {
      const opacity = 1 - translateY / 400
      backdropRef.current.style.opacity = Math.max(0.1, opacity).toString()
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging || !sheetRef.current) return

    const threshold = 100 // Pixels para considerar um swipe

    if (currentY > threshold) {
      onClose()
    } else {
      // Voltar à posição original com animação
      sheetRef.current.style.transition = "transform 0.3s ease-out"
      sheetRef.current.style.transform = "translateY(0)"

      if (backdropRef.current) {
        backdropRef.current.style.opacity = "1"
      }

      // Remover a transição após a animação
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transition = ""
        }
      }, 300)
    }

    setIsDragging(false)
    setCurrentY(0)
  }

  // Detectar clique fora para fechar
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose()
    }
  }

  // Detectar tecla ESC para fechar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  if (!mounted) return null

  const content = (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl transition-transform duration-300 max-w-md mx-auto ${
          isOpen && isAnimating ? "translate-y-0" : "translate-y-full"
        } ${className}`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Handle */}
        <div
          className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div ref={contentRef} className="overflow-hidden" style={{ maxHeight: "calc(90vh - 40px)" }}>
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
