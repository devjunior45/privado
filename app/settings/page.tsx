"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Eye, Shield, Palette, Mail, Lock, LogOut, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Estados para visibilidade
  const [phoneVisible, setPhoneVisible] = useState(true)
  const [emailVisible, setEmailVisible] = useState(true)

  // Estados para mudança de email/senha
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Estados para deletar conta
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      setUser(user)
      setProfile(profile)

      // Carregar configurações de visibilidade
      setPhoneVisible(profile?.phone_visible !== false)
      setEmailVisible(profile?.email_visible !== false)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateVisibilitySettings = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          phone_visible: phoneVisible,
          email_visible: emailVisible,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Configurações salvas",
        description: "Suas configurações de visibilidade foram atualizadas.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail) return

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (error) throw error

      toast({
        title: "Email atualizado",
        description: "Verifique seu novo email para confirmar a alteração.",
      })
      setShowChangeEmail(false)
      setNewEmail("")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar o email.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast({
        title: "Erro",
        description: "Digite sua senha atual.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Primeiro verificar se a senha atual está correta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error("Senha atual incorreta")
      }

      // Se a senha atual estiver correta, atualizar para a nova senha
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      })
      setShowChangePassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível alterar a senha.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })

      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer logout.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast({
        title: "Erro",
        description: "Digite sua senha para confirmar.",
        variant: "destructive",
      })
      return
    }

    setIsDeletingAccount(true)
    try {
      // Verificar se a senha está correta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      })

      if (signInError) {
        throw new Error("Senha incorreta")
      }

      // Deletar dados do perfil
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id)

      if (profileError) {
        console.error("Erro ao deletar perfil:", profileError)
      }

      // Deletar conta do usuário
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) {
        // Se não conseguir deletar via admin, fazer logout
        await supabase.auth.signOut()
      }

      toast({
        title: "Conta encerrada",
        description: "Sua conta foi encerrada com sucesso.",
      })

      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível encerrar a conta.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAccount(false)
      setShowDeleteAccount(false)
      setDeletePassword("")
    }
  }

  const handleThemeChange = (value: string) => {
    setTheme(value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Configurações</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        {/* Visibilidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Visibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="phone-visibility">Número de telefone</Label>
                <p className="text-sm text-muted-foreground">
                  {phoneVisible ? "Público (todos podem ver)" : "Privado (apenas você pode ver)"}
                </p>
              </div>
              <Switch id="phone-visibility" checked={phoneVisible} onCheckedChange={setPhoneVisible} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-visibility">E-mail</Label>
                <p className="text-sm text-muted-foreground">
                  {emailVisible ? "Público (todos podem ver)" : "Privado (apenas você pode ver)"}
                </p>
              </div>
              <Switch id="email-visibility" checked={emailVisible} onCheckedChange={setEmailVisible} />
            </div>

            <Button onClick={updateVisibilitySettings} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </CardContent>
        </Card>

        {/* Tema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Tema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Escolha o tema do aplicativo</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Sistema</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {theme === "system" && "Segue o tema do seu dispositivo"}
                {theme === "light" && "Tema claro sempre ativo"}
                {theme === "dark" && "Tema escuro sempre ativo"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trocar Email */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowChangeEmail(!showChangeEmail)}
                className="w-full justify-start"
              >
                <Mail className="w-4 h-4 mr-2" />
                Trocar e-mail da conta
              </Button>

              {showChangeEmail && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="current-email">E-mail atual</Label>
                    <Input id="current-email" value={user?.email || ""} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label htmlFor="new-email">Novo e-mail</Label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Digite o novo e-mail"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleChangeEmail} disabled={saving || !newEmail} className="flex-1">
                      {saving ? "Alterando..." : "Alterar e-mail"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowChangeEmail(false)
                        setNewEmail("")
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Trocar Senha */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="w-full justify-start"
              >
                <Lock className="w-4 h-4 mr-2" />
                Redefinir senha
              </Button>

              {showChangePassword && (
                <div className="space-y-3 p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="current-password">Senha atual</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Nova senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                      className="flex-1"
                    >
                      {saving ? "Alterando..." : "Alterar senha"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowChangePassword(false)
                        setCurrentPassword("")
                        setNewPassword("")
                        setConfirmPassword("")
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logout */}
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full justify-start bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Saindo..." : "Sair da conta"}
            </Button>

            {/* Deletar Conta */}
            <AlertDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Encerrar conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Encerrar conta</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente deletados, incluindo:
                    <br />
                    <br />• Perfil e informações pessoais
                    <br />• Histórico de candidaturas
                    <br />• Vagas salvas
                    <br />• Notificações
                    <br />
                    <br />
                    Digite sua senha para confirmar:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setDeletePassword("")
                    }}
                  >
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || !deletePassword}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeletingAccount ? "Encerrando..." : "Encerrar conta"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
