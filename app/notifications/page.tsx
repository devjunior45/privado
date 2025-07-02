import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import { NotificationsList } from "@/components/notifications/notifications-list"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Buscar perfil do usuário para cidade padrão
  const { data: userProfile } = await supabase.from("profiles").select("city_id").eq("id", user.id).single()

  return (
    <PageContainer header={<PageHeader title="Notificações" userProfile={userProfile} />}>
      <div className="mx-4">
        <NotificationsList userId={user.id} />
      </div>
    </PageContainer>
  )
}
