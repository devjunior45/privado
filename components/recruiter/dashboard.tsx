import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { JobsManagement } from "./jobs-management"

interface RecruiterDashboardProps {
  recruiterId: string
}

export function RecruiterDashboard({ recruiterId }: RecruiterDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Gerencie suas vagas de emprego</p>
        </div>
        <Button asChild>
          <Link href="/create-job">
            <Plus className="w-4 h-4 mr-2" />
            Nova Vaga
          </Link>
        </Button>
      </div>

      {/* Gestão de Vagas */}
      <JobsManagement recruiterId={recruiterId} />
    </div>
  )
}

// Export default também para compatibilidade
export default RecruiterDashboard
