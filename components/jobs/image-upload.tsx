"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { compressImage } from "@/utils/compress-image"

interface ImageUploadProps {
  /** Recebe o arquivo pronto para upload (comprimido) ou null quando removido. */
  onFileChange: (file: File | null) => void
}

export function ImageUpload({ onFileChange }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  // "loading" enquanto o bitmap é decodificado; "ready" quando o preview pode ser exibido.
  const [isReady, setIsReady] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  const revokeCurrentUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  // Libera o ObjectURL ao desmontar (evita memory leak).
  useEffect(() => revokeCurrentUrl, [revokeCurrentUrl])

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Revoga o preview anterior antes de criar um novo.
    revokeCurrentUrl()

    // createObjectURL é instantâneo e não bloqueia a thread (sem base64/FileReader).
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url

    // Atualiza o estado de forma síncrona: nome aparece imediatamente e o preview
    // entra em estado de "carregando".
    setFileName(file.name)
    setPreviewUrl(url)
    setIsReady(false)

    // Notifica o pai com o arquivo original imediatamente, garantindo que o upload
    // funcione mesmo que a compressão falhe.
    onFileChange(file)

    // decode() garante que o bitmap está totalmente decodificado ANTES de exibirmos
    // o <img> no DOM. Isso elimina o bug de paint-skip: quando o React pinta o
    // elemento, a imagem já está pronta e o navegador não pula o frame.
    try {
      const decoder = new window.Image()
      decoder.src = url
      await decoder.decode()
    } catch {
      // Se decode() falhar (formato incomum), o onLoad do <img> abaixo cobre o caso.
    }
    setIsReady(true)

    // Comprime em segundo plano e substitui o arquivo usado no upload ao terminar.
    compressImage(file, 400)
      .then((compressed) => onFileChange(compressed))
      .catch(() => {
        // Mantém o arquivo original se a compressão falhar.
      })
  }

  const handleRemove = () => {
    revokeCurrentUrl()
    setPreviewUrl(null)
    setFileName(null)
    setIsReady(false)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    onFileChange(null)
  }

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <div className="space-y-2">
            <Label htmlFor="image" className="cursor-pointer">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
                <Upload className="w-4 h-4" />
                Escolher Imagem
              </div>
            </Label>
            <Input
              ref={inputRef}
              id="image"
              type="file"
              accept="image/*"
              onChange={handleSelect}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">PNG, JPG até 5MB - Torna sua vaga mais atrativa</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative h-40 w-full overflow-hidden rounded-lg">
            {/* Skeleton exibido enquanto o bitmap é decodificado. */}
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {/*
              key={previewUrl} força o React a criar um NÓ DOM NOVO a cada seleção,
              garantindo layout/paint frescos e evitando reaproveitamento de um
              elemento antigo que poderia não repintar.
            */}
            <img
              key={previewUrl}
              src={previewUrl || "/placeholder.svg"}
              alt="Preview da vaga"
              className="h-40 w-full rounded-lg object-cover transition-opacity duration-200"
              style={{ opacity: isReady ? 1 : 0 }}
              onLoad={() => setIsReady(true)}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {fileName && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{fileName}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
