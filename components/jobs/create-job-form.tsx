"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, X, ImageIcon, Bold, List, Plus } from "lucide-react"
import { createJobPost } from "@/app/actions/posts"
import { useRouter } from "next/navigation"
import { CitySelect } from "@/components/ui/city-select"
import { useToast } from "@/components/ui/toast"
import { createClient } from "@/lib/supabase/client"

const DARK_COLORS = [
  { name: "Preto", value: "#1F2937", class: "bg-gray-800" },
  { name: "Azul Escuro", value: "#1E3A8A", class: "bg-blue-900" },
  { name: "Verde Escuro", value: "#064E3B", class: "bg-emerald-900" },
  { name: "Roxo Escuro", value: "#581C87", class: "bg-purple-900" },
  { name: "Vermelho Escuro", value: "#7F1D1D", class: "bg-red-900" },
  { name: "Índigo Escuro", value: "#312E81", class: "bg-indigo-900" },
  { name: "Rosa Escuro", value: "#831843", class: "bg-pink-900" },
  { name: "Laranja Escuro", value: "#9A3412", class: "bg-orange-900" },
]

const TEMPLATE_BLOCKS = {
  requisitos: `
## 📋 Requisitos

• **Escolaridade:** Ensino médio completo
• **Experiência:** Mínimo 1 ano na área
• **Conhecimentos:** 
  - Conhecimento em sistemas básicos
  - Boa comunicação
  - Proatividade
• **Diferenciais:**
  - Curso técnico na área
  - Conhecimento em Excel

`,
  atividades: `
## 🎯 Principais Atividades

• **Atendimento:** Atender clientes presenciais e por telefone
• **Vendas:** Apresentar produtos e serviços
• **Organização:** Manter o ambiente de trabalho organizado
• **Relatórios:** Elaborar relatórios diários de atividades
• **Suporte:** Auxiliar a equipe em demandas diversas

`,
  beneficios: `
## 🎁 Benefícios Oferecidos

• **Salário:** Compatível com o mercado
• **Vale Transporte:** Fornecido pela empresa
• **Vale Alimentação:** R$ 25,00/dia
• **Plano de Saúde:** Após período de experiência
• **Ambiente:** Clima organizacional positivo
• **Crescimento:** Oportunidades de desenvolvimento

`,
}

export function CreateJobForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [selectedColor, setSelectedColor] = useState(DARK_COLORS[0].value)
  const [companyName, setCompanyName] = useState("")
  const [description, setDescription] = useState("")
  const router = useRouter()
  const { showToast, ToastContainer } = useToast()

  // Buscar dados do perfil para preencher empresa
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, full_name")
          .eq("id", user.id)
          .single()

        if (profile) {
          setCompanyName(profile.company_name || profile.full_name || "")
        }
      }
    }

    fetchProfile()
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  // Função para inserir blocos de template
  const insertTemplateBlock = (blockType: keyof typeof TEMPLATE_BLOCKS) => {
    const textarea = document.getElementById("description") as HTMLTextAreaElement
    const start = textarea.selectionStart
    const template = TEMPLATE_BLOCKS[blockType]

    const newText = description.substring(0, start) + template + description.substring(start)
    setDescription(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + template.length, start + template.length)
    }, 0)
  }

  // Funções de formatação de texto
  const insertText = (before: string, after = "") => {
    const textarea = document.getElementById("description") as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = description.substring(start, end)
    const newText = description.substring(0, start) + before + selectedText + after + description.substring(end)
    setDescription(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const insertList = (type: "bullet" | "numbered") => {
    const textarea = document.getElementById("description") as HTMLTextAreaElement
    const start = textarea.selectionStart
    const lines = description.substring(0, start).split("\n")
    const currentLine = lines[lines.length - 1]

    let listItem = ""
    if (type === "bullet") {
      listItem = currentLine.trim() === "" ? "• " : "\n• "
    } else {
      listItem = currentLine.trim() === "" ? "1. " : "\n1. "
    }

    const newText = description.substring(0, start) + listItem + description.substring(start)
    setDescription(newText)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + listItem.length, start + listItem.length)
    }, 0)
  }

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      if (selectedCityId) {
        formData.append("cityId", selectedCityId.toString())
      }

      // Só adiciona cor se não houver imagem
      if (!selectedImage) {
        formData.append("postColor", selectedColor)
      }

      formData.append("company", companyName)
      formData.append("description", description)
      formData.append("allowPlatformApplications", "true")

      await createJobPost(formData)
      showToast("Vaga publicada com sucesso!", "success")
      router.push("/dashboard")
    } catch (error) {
      console.error("Erro ao criar vaga:", error)
      showToast("Erro inesperado ao publicar vaga", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-6">
        {/* Upload de Imagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Imagem da Vaga (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="image" className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        <Upload className="w-4 h-4" />
                        Escolher Imagem
                      </div>
                    </Label>
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    <p className="text-sm text-muted-foreground">PNG, JPG até 5MB - Torna sua vaga mais atrativa</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview da vaga"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Vaga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título da Vaga *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Desenvolvedor Frontend"
                required
                className="text-lg font-medium"
              />
            </div>

            <div>
              <Label htmlFor="company">Nome da Empresa *</Label>
              <Input
                id="company"
                name="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da empresa"
                required
              />
            </div>

            <div>
              <Label htmlFor="cityId">Localização *</Label>
              <CitySelect
                value={selectedCityId}
                onValueChange={setSelectedCityId}
                placeholder="Selecione a cidade da vaga"
                name="cityId"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Descrição com Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Descrição da Vaga *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botões de Templates */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Blocos Prontos:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplateBlock("requisitos")}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />📋 Requisitos
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplateBlock("atividades")}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />🎯 Atividades
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplateBlock("beneficios")}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />🎁 Benefícios
                </Button>
              </div>
            </div>

            {/* Barra de Ferramentas de Formatação */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-md">
              <Button type="button" variant="ghost" size="sm" onClick={() => insertText("**", "**")} title="Negrito">
                <Bold className="w-4 h-4" />
              </Button>

              <div className="w-px bg-border mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertList("bullet")}
                title="Lista com marcadores"
              >
                <List className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertList("numbered")}
                title="Lista numerada"
              >
                <span className="text-sm font-mono">1.</span>
              </Button>

              <div className="w-px bg-border mx-1" />

              <Button type="button" variant="ghost" size="sm" onClick={() => insertText("## ")} title="Título">
                <span className="text-xs font-bold">H2</span>
              </Button>

              <Button type="button" variant="ghost" size="sm" onClick={() => insertText("### ")} title="Subtítulo">
                <span className="text-xs font-bold">H3</span>
              </Button>
            </div>

            <div>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva a vaga ou use os blocos prontos acima...

Exemplo de estrutura:

## 📝 Sobre a Vaga
Descrição geral da posição e responsabilidades principais.

## 📋 Requisitos
• **Escolaridade:** Ensino médio completo
• **Experiência:** Mínimo 1 ano na área

## 🎯 Principais Atividades  
• Atender clientes
• Organizar documentos
• Elaborar relatórios

## 🎁 Benefícios
• Vale transporte
• Vale alimentação
• Plano de saúde"
                rows={16}
                required
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent font-mono"
              />
            </div>

            {/* Preview da Formatação */}
            {description && (
              <div className="border rounded-md p-4 bg-muted/30">
                <Label className="text-sm font-medium mb-2 block">Preview da Formatação:</Label>
                <div
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{
                    __html: description
                      .replace(/## (.*)/g, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
                      .replace(/### (.*)/g, '<h3 class="text-base font-semibold mt-3 mb-2">$1</h3>')
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/• (.*)/g, '<li style="margin-left: 1rem;">$1</li>')
                      .replace(/\n/g, "<br>"),
                  }}
                />
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Dicas de Formatação:</strong>
              </p>
              <p>
                • Use <code>## Título</code> para seções principais
              </p>
              <p>
                • Use <code>**texto**</code> para negrito
              </p>
              <p>
                • Use <code>• item</code> para listas
              </p>
              <p>• Use emojis para destacar seções (📋 🎯 🎁)</p>
            </div>
          </CardContent>
        </Card>

        {/* Seletor de Cor - Só aparece se não houver imagem */}
        {!selectedImage && (
          <Card>
            <CardHeader>
              <CardTitle>Cor do Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Escolha uma cor escura para destacar sua vaga no feed</p>
                <div className="grid grid-cols-4 gap-3">
                  {DARK_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`
                        relative w-12 h-12 rounded-full border-2 transition-all
                        ${
                          selectedColor === color.value
                            ? "border-primary ring-2 ring-primary/20 scale-110"
                            : "border-border hover:border-primary/50 hover:scale-105"
                        }
                        ${color.class}
                      `}
                    >
                      {selectedColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                      )}
                      <span className="sr-only">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar Vaga"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>

      <ToastContainer />
    </div>
  )
}
