import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { Button } from "@/components/ui/button"
import { Bell, Zap, Target, Briefcase } from "lucide-react"
import Link from "next/link"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Notificações" showSettings={false} isLoggedIn={false} />
        <div className="mx-4 md:mx-0">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
            <div className="mb-8">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Bell className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Receba notificações personalizadas</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Seja o primeiro a saber sobre vagas que combinam com seu perfil e nunca perca uma oportunidade.
              </p>

              <div className="space-y-3 mb-8 flex flex-col items-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>Alertas instantâneos de novas vagas</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Target className="w-4 h-4 text-primary" />
                  <span>Vagas que são a sua cara</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>Updates sobre suas candidaturas</span>
                </div>
              </div>
            </div>

            <Link href="/login">
              <Button size="lg" className="w-full max-w-sm">
                Criar Conta ou Entrar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Notificações" showSettings={false} isLoggedIn={true} />
      <div className="mx-4 md:mx-0">
        <NotificationsList />
      </div>
    </div>
  )
}
