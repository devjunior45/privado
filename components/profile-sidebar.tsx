"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Briefcase, GraduationCap, User, Building2, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useCityName } from "@/hooks/use-city-name"

interface ProfileSidebarProps {
  user?: any
  profile?: any
}

export function ProfileSidebar({ user, profile }: ProfileSidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const cityName = useCityName(profile?.city_id)

  const { data: jobPosts } = useQuery({
    queryKey: ["user-job-posts", user?.id],
    queryFn: async () => {
      if (!user?.id || profile?.user_type !== "recruiter") return []

      const { data } = await supabase
        .from("job_posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)

      return data || []
    },
    enabled: !!user?.id && profile?.user_type === "recruiter",
  })

  if (!user || !profile) {
    return (
      <div className="w-64 p-4 space-y-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold mb-2">Faça login</h3>
            <p className="text-sm text-muted-foreground mb-4">Acesse seu perfil e encontre as melhores oportunidades</p>
            <Button onClick={() => router.push("/login")} className="w-full" size="sm">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isRecruiter = profile.user_type === "recruiter"

  return (
    <div className="w-64 p-4 space-y-4">
      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col items-center text-center">
            <Avatar className="w-16 h-16 mb-3">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {profile.full_name?.charAt(0) || profile.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-semibold text-sm">{profile.full_name || "Usuário"}</h3>
            {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {isRecruiter ? (
            <>
              {profile.company_name && (
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{profile.company_name}</span>
                </div>
              )}
              {cityName && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{cityName}</span>
                </div>
              )}
              {profile.bio && <p className="text-xs text-muted-foreground line-clamp-3">{profile.bio}</p>}
            </>
          ) : (
            <>
              {profile.current_position && (
                <div className="flex items-center gap-2 text-xs">
                  <Briefcase className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{profile.current_position}</span>
                </div>
              )}
              {cityName && (
                <div className="flex items-center gap-2 text-xs">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{cityName}</span>
                </div>
              )}
              {profile.education && profile.education.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <GraduationCap className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{profile.education[0].institution}</span>
                </div>
              )}
              {profile.skills && profile.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium">Principais habilidades</p>
                  <div className="flex flex-wrap gap-1">
                    {profile.skills.slice(0, 3).map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push("/profile")} className="w-full text-xs">
            Ver perfil completo
          </Button>
        </CardContent>
      </Card>

      {/* Recruiter Jobs */}
      {isRecruiter && jobPosts && jobPosts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h4 className="font-semibold text-sm">Vagas ativas</h4>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {jobPosts.map((job: any) => (
              <div
                key={job.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => router.push(`/post/${job.id}`)}
              >
                <h5 className="font-medium text-xs mb-1 line-clamp-1">{job.title}</h5>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(job.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")} className="w-full text-xs">
              Ver todas as vagas
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
