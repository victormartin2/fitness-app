"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { es } from "date-fns/locale"
import {
  Loader2,
  BarChart3,
  Scale,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Flame,
  ArrowRight,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

export default function StatsPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [weights, setWeights] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("6m") // all, 6m, 3m, 1m
  const [stats, setStats] = useState({
    currentWeight: null,
    weightChange: null,
    totalWorkouts: 0,
    workoutsThisMonth: 0,
    mostFrequentExercise: null,
    exerciseCount: {},
    monthlyWorkouts: [],
    personalRecords: [],
    streaks: {
      current: 0,
      longest: 0,
    },
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        // Get current date and time ranges
        const now = new Date()
        const sixMonthsAgo = subMonths(now, 6)
        const thisMonthStart = startOfMonth(now)

        // Fetch weights
        const { data: weightsData, error: weightsError } = await supabase
          .from("weights")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true })

        if (weightsError) throw weightsError
        setWeights(weightsData || [])

        // Fetch workouts
        const { data: workoutsData, error: workoutsError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })

        if (workoutsError) throw workoutsError
        setWorkouts(workoutsData || [])

        // Fetch exercises
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*, workouts!inner(*)")
          .eq("workouts.user_id", user.id)

        if (exercisesError) throw exercisesError
        setExercises(exercisesData || [])

        // Calculate stats
        const currentWeight = weightsData && weightsData.length > 0 ? weightsData[weightsData.length - 1].weight : null
        const oldestWeight = weightsData && weightsData.length > 1 ? weightsData[0].weight : currentWeight
        const weightChange = currentWeight && oldestWeight ? currentWeight - oldestWeight : null

        const workoutsThisMonth = workoutsData
          ? workoutsData.filter((w) => new Date(w.date) >= thisMonthStart).length
          : 0

        // Count exercises by name
        const exerciseCounts = {}
        exercisesData?.forEach((exercise) => {
          exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1
        })

        // Find most frequent exercise
        let mostFrequentExercise = null
        let maxCount = 0
        for (const [exercise, count] of Object.entries(exerciseCounts)) {
          if (count > maxCount) {
            mostFrequentExercise = exercise
            maxCount = count
          }
        }

        // Calculate monthly workouts for chart
        const monthlyWorkouts = []
        if (workoutsData && workoutsData.length > 0) {
          // Get date range
          const oldestWorkoutDate = new Date(
            workoutsData.reduce(
              (oldest, workout) => (new Date(workout.date) < new Date(oldest.date) ? workout : oldest),
              workoutsData[0],
            ).date,
          )

          const startDate = subMonths(now, 5)
          const months = eachMonthOfInterval({ start: startDate, end: now })

          months.forEach((month) => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)
            const count = workoutsData.filter((w) => {
              const date = new Date(w.date)
              return date >= monthStart && date <= monthEnd
            }).length

            monthlyWorkouts.push({
              month: format(month, "MMM", { locale: es }),
              count,
            })
          })
        }

        // Calculate workout streaks
        let currentStreak = 0
        let longestStreak = 0
        let previousDate = null

        // Sort workouts by date ascending
        const sortedWorkouts = [...workoutsData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        sortedWorkouts.forEach((workout) => {
          const workoutDate = new Date(workout.date)

          if (!previousDate) {
            currentStreak = 1
          } else {
            // Check if this workout is consecutive to the previous one
            const dayDiff = Math.floor((workoutDate - previousDate) / (1000 * 60 * 60 * 24))

            if (dayDiff === 1) {
              // Consecutive day
              currentStreak++
            } else if (dayDiff > 1) {
              // Streak broken
              if (currentStreak > longestStreak) {
                longestStreak = currentStreak
              }
              currentStreak = 1
            }
          }

          previousDate = workoutDate
        })

        // Check if current streak is the longest
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak
        }

        // Update stats
        setStats({
          currentWeight,
          weightChange,
          totalWorkouts: workoutsData?.length || 0,
          workoutsThisMonth,
          mostFrequentExercise,
          exerciseCount: exerciseCounts,
          monthlyWorkouts,
          personalRecords: [], // To be implemented
          streaks: {
            current: currentStreak,
            longest: longestStreak,
          },
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos estadísticos",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, user, router, toast])

  // Prepare exercise distribution data for pie chart
  const getExerciseDistributionData = () => {
    const data = []
    let otherCount = 0
    let totalCount = 0

    // Count total
    Object.values(stats.exerciseCount).forEach((count) => {
      totalCount += count
    })

    // Get top 5 exercises
    const sortedExercises = Object.entries(stats.exerciseCount).sort((a, b) => b[1] - a[1])

    // Add top 4 exercises
    sortedExercises.slice(0, 4).forEach(([name, count]) => {
      data.push({
        name,
        value: count,
        percentage: Math.round((count / totalCount) * 100),
      })
    })

    // Group the rest as "Otros"
    sortedExercises.slice(4).forEach(([_, count]) => {
      otherCount += count
    })

    if (otherCount > 0) {
      data.push({
        name: "Otros",
        value: otherCount,
        percentage: Math.round((otherCount / totalCount) * 100),
      })
    }

    return data
  }

  const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c"]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">Resumen de tu actividad y progreso</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Peso actual</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {stats.currentWeight ? `${stats.currentWeight} kg` : "Sin datos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.weightChange !== null && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  stats.weightChange > 0
                    ? "text-red-500"
                    : stats.weightChange < 0
                      ? "text-green-500"
                      : "text-muted-foreground"
                }`}
              >
                {stats.weightChange > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : stats.weightChange < 0 ? (
                  <TrendingDown className="h-4 w-4" />
                ) : null}
                <span>
                  {stats.weightChange > 0
                    ? `+${stats.weightChange.toFixed(1)} kg`
                    : stats.weightChange < 0
                      ? `${stats.weightChange.toFixed(1)} kg`
                      : "Sin cambios"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de entrenamientos</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              {stats.totalWorkouts}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{stats.workoutsThisMonth} este mes</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ejercicio más frecuente</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {stats.mostFrequentExercise || "Sin datos"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Basado en todos tus entrenamientos</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Racha actual</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              {stats.streaks.current} {stats.streaks.current === 1 ? "día" : "días"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Racha más larga: {stats.streaks.longest} {stats.streaks.longest === 1 ? "día" : "días"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Entrenamientos por mes
            </CardTitle>
            <CardDescription>Frecuencia de tus entrenamientos</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.monthlyWorkouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No hay suficientes datos para mostrar</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyWorkouts} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${value} entrenamientos`, "Cantidad"]} />
                    <Bar dataKey="count" name="Entrenamientos" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progreso de ejercicios
            </CardTitle>
            <CardDescription>Evolución de tus ejercicios principales</CardDescription>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No hay suficientes datos para mostrar</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mostrar progreso de los 3 ejercicios más frecuentes */}
                {Object.entries(stats.exerciseCount)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([exerciseName, count]) => {
                    // Aquí podrías implementar lógica para mostrar el progreso real
                    // Por ahora mostramos una barra de progreso simulada
                    return (
                      <div key={exerciseName} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{exerciseName}</span>
                          <span className="text-xs text-muted-foreground">{count} veces</span>
                        </div>
                        <Progress value={Math.min(count * 10, 100)} className="h-2" />
                      </div>
                    )
                  })}

                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/workouts">Ver todos los entrenamientos</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Evolución de peso
            </CardTitle>
            <CardDescription>Cambios en tu peso a lo largo del tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            {weights.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">Necesitas al menos dos registros de peso para ver la evolución</p>
                <Button asChild className="mt-4">
                  <Link href="/weight">Ver registros de peso</Link>
                </Button>
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weights.map((w) => ({
                      date: new Date(w.date).getTime(),
                      weight: w.weight,
                      formattedDate: format(new Date(w.date), "dd MMM yyyy", { locale: es }),
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(timestamp) => format(new Date(timestamp), "dd/MM")}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`${value} kg`, "Peso"]}
                      labelFormatter={(label) => format(new Date(label), "dd MMMM yyyy", { locale: es })}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Últimos logros
            </CardTitle>
            <CardDescription>Tus progresos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            {workouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No hay entrenamientos registrados aún</p>
                <Button asChild className="mt-4">
                  <Link href="/workouts/add">Añadir entrenamiento</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.slice(0, 3).map((workout) => (
                  <div key={workout.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{workout.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(workout.date), "d MMMM yyyy", { locale: es })}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/workouts/${workout.id}`}>
                        <span className="flex items-center">
                          Ver <ArrowRight className="ml-1 h-4 w-4" />
                        </span>
                      </Link>
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
      </div>
    </div>
  )
}
