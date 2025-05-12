"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, Settings, LogOut } from "lucide-react"

export default function ProfilePage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    workouts: 0,
    weights: 0,
    memberSince: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) throw error
        setProfile(data)

        // Fetch stats
        const [workoutsResponse, weightsResponse] = await Promise.all([
          supabase.from("workouts").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("weights").select("id", { count: "exact" }).eq("user_id", user.id),
        ])

        setStats({
          workouts: workoutsResponse.count || 0,
          weights: weightsResponse.count || 0,
          memberSince: new Date(user.created_at).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        })
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase, user, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-6">Perfil</h1>
      <p className="text-muted-foreground mb-8">Gestiona tu información personal y configuración</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Información personal</CardTitle>
              <CardDescription>Tu información básica de perfil</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">{profile?.name || user.email.split("@")[0]}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => router.push("/profile/edit")}>
                Editar perfil
              </Button>
              <Button
                variant="ghost"
                className="mt-2 w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="stats">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>
            <TabsContent value="stats" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Estadísticas</CardTitle>
                  <CardDescription>Resumen de tu actividad en la aplicación</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <h3 className="text-muted-foreground text-sm">Entrenamientos registrados</h3>
                      <p className="text-3xl font-bold mt-2">{stats.workouts}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <h3 className="text-muted-foreground text-sm">Registros de peso</h3>
                      <p className="text-3xl font-bold mt-2">{stats.weights}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <h3 className="text-muted-foreground text-sm">Miembro desde</h3>
                      <p className="text-lg font-medium mt-2">{stats.memberSince}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Configuración</CardTitle>
                  <CardDescription>Gestiona tus preferencias de la aplicación</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => router.push("/profile/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Ir a configuración
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
