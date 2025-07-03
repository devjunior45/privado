import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { NotificationsList } from "@/components/notifications/notifications-list"
import { PageContainer } from "@/components/page-container"
import { LoginPrompt } from "@/components/auth/login-prompt"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <PageContainer>
        <div className="md:hidden">
          <Header title="Notificações" isLoggedIn={false} />
        </div>
        <div className="mx-4 md:mx-0 py-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Receba notificações personalizadas</h2>
              <p className="text-muted-foreground mb-4">
                Faça login para receber notificações de vagas que são a sua cara e atualizações importantes
              </p>
            </div>
            <LoginPrompt />
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="md:hidden">
        <Header title="Notificações" isLoggedIn={true} />
      </div>
      <div className="mx-4 md:mx-0">
        <NotificationsList />
      </div>
    </PageContainer>
  )
}
