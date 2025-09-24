"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building, Plus, ShieldCheck, Briefcase, GraduationCap, Settings } from "lucide-react"
import Link from "next/link"
import { CityDisplay } from "@/components/ui/city-display"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

interface ProfileSidebarProps {
  isLoggedIn: boolean
  userProfile: any
}

export function ProfileSidebar({ isLoggedIn, userProfile }: ProfileSidebarProps) {
  const [activeJobs, setActiveJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (isLoggedIn && userProfile?.user_type === "recruiter") {
      fetchActiveJobs()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn, userProfile])

  const fetchActiveJobs = async () => {
    try {
      const { data } = await supabase
        .from("job_posts")
        .select("id, title, location")
        .eq("author_id", userProfile.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5)

      setActiveJobs(data || [])
    } catch (error) {
      console.error("Erro ao buscar vagas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <aside className="w-64 bg-background border-r h-full overflow-hidden">
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground mb-3 text-sm">Faça login para ver seu perfil</p>
              <Button asChild className="w-full" size="sm">
                <Link href="/login">Entrar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>
    )
  }

  if (loading) {
    return (
      <aside className="w-64 bg-background border-r h-full overflow-hidden">
        <div className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 bg-background border-r h-full overflow-hidden">
      <div className="p-4 space-y-4 h-full overflow-y-auto">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={userProfile.avatar_url || "/placeholder.svg"} alt={userProfile.full_name || ""} />
                  <AvatarFallback className="text-lg">
                    {(userProfile.full_name || userProfile.company_name || userProfile.username)
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {userProfile.is_verified && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-semibold text-sm">
                    {userProfile.user_type === "recruiter"
                      ? userProfile.company_name || userProfile.full_name || userProfile.username
                      : userProfile.full_name || userProfile.username}
                  </h2>
                  {userProfile.is_verified && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <ShieldCheck className="w-2 h-2 mr-1" />
                      Verificado
                    </Badge>
                  )}
                </div>

                {userProfile.city_id && (
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mt-1">
                    <MapPin className="w-3 h-3" />
                    <CityDisplay cityId={userProfile.city_id} />
                  </div>
                )}
              </div>

              {userProfile.professional_summary && (
                <p className="text-xs text-muted-foreground line-clamp-2">{userProfile.professional_summary}</p>
              )}

              <div className="w-full space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full bg-transparent text-xs h-8">
                  <Link href="/profile">Ver Perfil Completo</Link>
                </Button>

                <Button asChild variant="ghost" size="sm" className="w-full text-xs h-8">
                  <Link href="/settings">
                    <Settings className="w-3 h-3 mr-2" />
                    Configurações da Conta
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Specific Content */}
        {userProfile.user_type === "candidate" && (
          <>
            {/* Skills */}
            {userProfile.skills && userProfile.skills.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">Principais Habilidades</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {userProfile.skills.slice(0, 6).map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs py-0 px-2">
                        {skill}
                      </Badge>
                    ))}
                    {userProfile.skills.length > 6 && (
                      <Badge variant="outline" className="text-xs py-0 px-2">
                        +{userProfile.skills.length - 6}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience Summary */}
            {userProfile.experiences && userProfile.experiences.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Briefcase className="w-3 h-3" />
                    Experiência
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {userProfile.experiences.slice(0, 2).map((exp: any, index: number) => (
                      <div key={index} className="text-xs">
                        <p className="font-medium">{exp.position}</p>
                        {exp.company && <p className="text-muted-foreground">{exp.company}</p>}
                      </div>
                    ))}
                    {userProfile.experiences.length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{userProfile.experiences.length - 2} experiências
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education Summary */}
            {userProfile.education && userProfile.education.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <GraduationCap className="w-3 h-3" />
                    Formação
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {userProfile.education.slice(0, 2).map((edu: any, index: number) => (
                      <div key={index} className="text-xs">
                        <p className="font-medium">{edu.courseName || edu.level}</p>
                        <p className="text-muted-foreground">{edu.institution}</p>
                      </div>
                    ))}
                    {userProfile.education.length > 2 && (
                      <p className="text-xs text-muted-foreground">+{userProfile.education.length - 2} formações</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* First Job Badge */}
            {userProfile.is_first_job && (
              <Card>
                <CardContent className="p-3">
                  <Badge className="bg-blue-100 text-blue-800 w-full justify-center text-xs">Primeiro Emprego</Badge>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Recruiter Specific Content */}
        {userProfile.user_type === "recruiter" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Building className="w-3 h-3" />
                Vagas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activeJobs.length > 0 ? (
                <div className="space-y-2">
                  {activeJobs.map((job) => (
                    <Link href={`/feed?post=${job.id}`} key={job.id}>
                      <div className="p-2 border rounded hover:bg-muted/50 transition-colors">
                        <p className="font-medium text-xs">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.location}</p>
                      </div>
                    </Link>
                  ))}
                  <Button asChild variant="outline" size="sm" className="w-full mt-2 bg-transparent text-xs h-7">
                    <Link href="/dashboard">Ver Todas</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground mb-2">Nenhuma vaga ativa</p>
                  <Button asChild size="sm" className="w-full text-xs h-7">
                    <Link href="/create-job">
                      <Plus className="w-3 h-3 mr-1" />
                      Publicar Vaga
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </aside>
  )
}
