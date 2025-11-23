export async function compressImage(file: File, maxSizeKB = 400): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Não foi possível criar contexto do canvas"))
          return
        }

        // Calcular dimensões mantendo aspect ratio
        let width = img.width
        let height = img.height
        const maxDimension = 1200

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Comprimir com qualidade ajustável
        const quality = 0.9
        const targetSize = maxSizeKB * 1024

        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Falha ao comprimir imagem"))
                return
              }

              // Se ainda está maior que o target e qualidade > 0.1, tentar novamente
              if (blob.size > targetSize && currentQuality > 0.1) {
                tryCompress(currentQuality - 0.1)
                return
              }

              // Criar novo File com o blob comprimido
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })

              resolve(compressedFile)
            },
            "image/jpeg",
            currentQuality,
          )
        }

        tryCompress(quality)
      }

      img.onerror = () => reject(new Error("Erro ao carregar imagem"))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error("Erro ao ler arquivo"))
    reader.readAsDataURL(file)
  })
}
