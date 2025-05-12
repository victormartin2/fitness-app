"use client"

import { useEffect, useState, useMemo } from "react"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Dumbbell,
  Scale,
  Calendar,
  BarChart3,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  Trophy,
  Info,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { format, subDays, isToday, startOfWeek, addDays, isSameWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { supabase, user, loading } = useSupabase()
  const [profile, setProfile] = useState(null)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [weightData, setWeightData] = useState({ current: null, previous: null, change: null })
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    weeklyGoal: 3, // Por defecto 3 entrenamientos por semana
    mostFrequentExercise: null,
  })
  const [loading2, setLoading2] = useState(true)
  const [workoutDays, setWorkoutDays] = useState([])
  const { toast } = useToast()
  const router = useRouter()

  // Función para crear manualmente el perfil
  const createProfile = async () => {
    if (!user) return

    setIsCreatingProfile(true)
    try {
      // Verificar si el perfil ya existe
      const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (!existingProfile) {
        // Si no existe, crear uno nuevo
        const { error } = await supabase.from("profiles").insert([
          {
            id: user.id,
            name: user.user_metadata?.name || "Usuario",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (error) {
          console.error("Error creating profile:", error)
          toast({
            variant: "destructive",
            title: "Error al crear perfil",
            description: error.message,
          })
          return
        }

        toast({
          title: "Perfil creado",
          description: "Tu perfil ha sido creado correctamente",
        })

        // Obtener el perfil recién creado
        const { data: newProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setProfile(newProfile)
      } else {
        setProfile(existingProfile)
      }
    } catch (error) {
      console.error("Error in createProfile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el perfil. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setIsCreatingProfile(false)
    }
  }

  useEffect(() => {
    const getProfile = async () => {
      if (!user) {
        setLoadingProfile(false)
        return
      }

      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
          // Si no existe el perfil, intentar crearlo
          if (error.code === "PGRST116") {
            await createProfile()
          }
        } else {
          setProfile(data)
        }
      } catch (error) {
        console.error("Error in getProfile:", error)
      } finally {
        setLoadingProfile(false)
      }
    }

    getProfile()
  }, [user, supabase])

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading2(false)
        return
      }

      try {
        // Obtener entrenamientos recientes
        const { data: workouts, error: workoutsError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(3)

        if (workoutsError) throw workoutsError
        setRecentWorkouts(workouts || [])

        // Calcular estadísticas de entrenamientos
        const { data: allWorkouts, error: allWorkoutsError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)

        if (allWorkoutsError) throw allWorkoutsError

        // Calcular entrenamientos de esta semana
        const today = new Date()
        const oneWeekAgo = subDays(today, 7)
        const thisWeekWorkouts =
          allWorkouts?.filter((w) => {
            const workoutDate = new Date(w.date)
            return isSameWeek(workoutDate, today)
          }).length || 0

        // Obtener días de la semana con entrenamientos
        const workoutDaysInWeek =
          allWorkouts
            ?.filter((w) => {
              const workoutDate = new Date(w.date)
              return isSameWeek(workoutDate, today)
            })
            .map((w) => new Date(w.date).getDay()) || []

        setWorkoutDays(workoutDaysInWeek)

        // Obtener ejercicio más frecuente
        const { data: exercises, error: exercisesError } = await supabase
          .from("exercises")
          .select("name, workout_id, workouts!inner(*)")
          .eq("workouts.user_id", user.id)

        if (exercisesError) throw exercisesError

        // Contar ejercicios
        const exerciseCounts = {}
        exercises?.forEach((ex) => {
          exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + 1
        })

        // Encontrar el más frecuente
        let mostFrequentExercise = null
        let maxCount = 0
        for (const [exercise, count] of Object.entries(exerciseCounts)) {
          if (count > maxCount) {
            mostFrequentExercise = exercise
            maxCount = count
          }
        }

        setStats({
          totalWorkouts: allWorkouts?.length || 0,
          thisWeekWorkouts,
          weeklyGoal: 3, // Por defecto
          mostFrequentExercise,
        })

        // Obtener datos de peso
        const { data: weights, error: weightsError } = await supabase
          .from("weights")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(2)

        if (weightsError) throw weightsError

        if (weights && weights.length > 0) {
          const current = weights[0].weight
          const previous = weights.length > 1 ? weights[1].weight : current
          const change = current - previous

          setWeightData({
            current,
            previous,
            change,
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos del dashboard",
        })
      } finally {
        setLoading2(false)
      }
    }

    fetchDashboardData()
  }, [user, supabase, toast])

  // Memoizar los días de la semana para evitar recálculos innecesarios
  const weekDays = useMemo(() => {
    const today = new Date()
    const startDay = startOfWeek(today, { weekStartsOn: 1 }) // Lunes como primer día

    return Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(startDay, i)
      const hasWorkout = workoutDays.includes(day.getDay())

      return {
        label: ["L", "M", "X", "J", "V", "S", "D"][i],
        date: day,
        hasWorkout,
        isToday: isToday(day),
      }
    })
  }, [workoutDays])

  if (loading || loadingProfile) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">No has iniciado sesión</CardTitle>
            <CardDescription>Debes iniciar sesión para acceder al dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full">Iniciar sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Perfil no encontrado</CardTitle>
            <CardDescription>No se ha encontrado tu perfil en la base de datos</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p>Necesitamos crear tu perfil para que puedas usar la aplicación.</p>
            <Button onClick={createProfile} disabled={isCreatingProfile}>
              {isCreatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando perfil...
                </>
              ) : (
                "Crear perfil"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bienvenido, {profile.name}</h1>
        <p className="text-muted-foreground mt-1">Resumen de tu actividad y progreso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Peso actual</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {weightData.current ? `${weightData.current} kg` : "Sin datos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weightData.change !== null && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  weightData.change > 0
                    ? "text-red-500"
                    : weightData.change < 0
                      ? "text-green-500"
                      : "text-muted-foreground"
                }`}
              >
                {weightData.change > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : weightData.change < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                <span>
                  {weightData.change > 0
                    ? `+${weightData.change.toFixed(1)} kg`
                    : weightData.change < 0
                      ? `${weightData.change.toFixed(1)} kg`
                      : "Sin cambios"}
                </span>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" asChild className="w-full justify-start">
              <Link href="/weight">
                <Scale className="mr-2 h-4 w-4" />
                Ver registro de peso
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Entrenamientos esta semana</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              {stats.thisWeekWorkouts} / {stats.weeklyGoal}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={(stats.thisWeekWorkouts / stats.weeklyGoal) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">{stats.totalWorkouts} entrenamientos en total</p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" asChild className="w-full justify-start">
              <Link href="/workouts">
                <Dumbbell className="mr-2 h-4 w-4" />
                Ver entrenamientos
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ejercicio más frecuente</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              {stats.mostFrequentExercise || "Sin datos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Basado en todos tus entrenamientos</p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="ghost" size="sm" asChild className="w-full justify-start">
              <Link href="/stats">
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver estadísticas
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Acciones rápidas</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Añadir nuevo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <Link href="/workouts/add">
                <Dumbbell className="mr-2 h-4 w-4" />
                Nuevo entrenamiento
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <Link href="/weight/add">
                <Scale className="mr-2 h-4 w-4" />
                Nuevo registro de peso
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Entrenamientos recientes
            </CardTitle>
            <CardDescription>Tus últimos entrenamientos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {loading2 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentWorkouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No has registrado ningún entrenamiento aún</p>
                <Button className="mt-4" asChild>
                  <Link href="/workouts/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir entrenamiento
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="flex justify-between items-center border-b pb-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    onClick={() => router.push(`/workouts/${workout.id}`)}
                  >
                    <div>
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(workout.date), "d MMMM yyyy", { locale: es })}
                        {workout.duration && (
                          <>
                            <Clock className="h-3 w-3 ml-2" />
                            {workout.duration}
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/workouts/${workout.id}`}>Ver</Link>
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/workouts">Ver todos los entrenamientos</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Actividad reciente
              </CardTitle>
              <CardDescription>Resumen de tu actividad</CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Información</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Los días en azul indican días con entrenamientos registrados en la semana actual.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardHeader>
          <CardContent>
            {loading2 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Entrenamientos por semana</h3>
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day, i) => (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors
                                ${day.isToday ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}
                                ${
                                  day.hasWorkout
                                    ? "bg-primary/80 text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                            >
                              {day.label}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {format(day.date, "EEEE d 'de' MMMM", { locale: es })}
                              {day.hasWorkout && " - Entrenamiento registrado"}
                              {day.isToday && " (Hoy)"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Próximos objetivos</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">Completar {stats.weeklyGoal} entrenamientos esta semana</div>
                      <div className="text-sm font-medium">
                        {stats.thisWeekWorkouts}/{stats.weeklyGoal}
                      </div>
                    </div>
                    <Progress value={(stats.thisWeekWorkouts / stats.weeklyGoal) * 100} className="h-2" />
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/stats">Ver todas las estadísticas</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
