"use client"

import React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, ArrowLeft, Calendar, Clock, Dumbbell, Trash2, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function WorkoutDetailsPage({ params }) {
  // Usar React.use para acceder a params.id (soluciona la advertencia de Next.js)
  const id = React.use(params).id
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [exerciseSets, setExerciseSets] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Validar que el ID sea un UUID válido
  const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchWorkoutDetails = async () => {
      try {
        // Validar el ID antes de hacer la consulta
        if (!id || id === "NaN" || !isValidUUID(id)) {
          setError("ID de entrenamiento inválido")
          setLoading(false)
          toast({
            variant: "destructive",
            title: "Error",
            description: "ID de entrenamiento inválido",
          })
          setTimeout(() => router.push("/workouts"), 2000)
          return
        }

        // Obtener detalles del entrenamiento - NO usar .single()
        const { data: workoutData, error: workoutError } = await supabase
          .from("workouts")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)

        if (workoutError) {
          throw workoutError
        }

        // Verificar si se encontró el entrenamiento
        if (!workoutData || workoutData.length === 0) {
          setError("Entrenamiento no encontrado")
          setLoading(false)
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se encontró el entrenamiento o no tienes permiso para verlo",
          })
          return
        }

        // Usar el primer resultado
        setWorkout(workoutData[0])

        // Obtener ejercicios del entrenamiento
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .eq("workout_id", id)
          .order("created_at", { ascending: true })

        if (exercisesError) {
          console.error("Error al obtener ejercicios:", exercisesError)
          // No lanzamos error aquí, simplemente mostramos un array vacío
          setExercises([])
        } else {
          setExercises(exercisesData || [])

          // Obtener las series individuales para cada ejercicio
          if (exercisesData && exercisesData.length > 0) {
            const exerciseIds = exercisesData.map((ex) => ex.id)

            const { data: setsData, error: setsError } = await supabase
              .from("exercise_sets")
              .select("*")
              .in("exercise_id", exerciseIds)
              .order("set_number", { ascending: true })

            if (setsError) {
              console.error("Error al obtener series:", setsError)
            } else if (setsData && setsData.length > 0) {
              // Organizar las series por ejercicio
              const setsByExercise = {}
              setsData.forEach((set) => {
                if (!setsByExercise[set.exercise_id]) {
                  setsByExercise[set.exercise_id] = []
                }
                setsByExercise[set.exercise_id].push(set)
              })

              setExerciseSets(setsByExercise)
            }
          }
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching workout details:", err)
        setError(err.message || "Error al cargar los detalles del entrenamiento")
        setLoading(false)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error al cargar los detalles: ${err.message}`,
        })
      }
    }

    fetchWorkoutDetails()
  }, [id, router, supabase, toast, user])

  const handleDeleteWorkout = async () => {
    try {
      // Primero eliminar los ejercicios relacionados (las series se eliminarán en cascada)
      const { error: exercisesError } = await supabase.from("exercises").delete().eq("workout_id", id)

      if (exercisesError) {
        throw exercisesError
      }

      // Luego eliminar el entrenamiento
      const { error: workoutError } = await supabase.from("workouts").delete().eq("id", id)

      if (workoutError) {
        throw workoutError
      }

      toast({
        title: "Éxito",
        description: "Entrenamiento eliminado correctamente",
      })

      router.push("/workouts")
    } catch (err) {
      console.error("Error deleting workout:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: `Error al eliminar el entrenamiento: ${err.message}`,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => router.push("/workouts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a entrenamientos
          </Button>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-2xl font-bold mb-4">Entrenamiento no encontrado</h1>
          <Button className="mt-4" onClick={() => router.push("/workouts")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a entrenamientos
          </Button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return format(date, "dd MMMM yyyy", { locale: es })
  }

  // Función para obtener las series de un ejercicio
  const getExerciseSets = (exerciseId) => {
    return exerciseSets[exerciseId] || []
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push("/workouts")} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Volver a entrenamientos</span>
          <span className="sm:hidden">Volver</span>
        </Button>

        <Button variant="outline" className="flex items-center" asChild>
          <Link href={`/workouts/${id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Editar entrenamiento</span>
            <span className="sm:hidden">Editar</span>
          </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex items-center">
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Eliminar entrenamiento</span>
              <span className="sm:hidden">Eliminar</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente este entrenamiento y todos sus
                ejercicios.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteWorkout}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">{workout.name}</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-3 text-sm md:text-base">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>{formatDate(workout.date)}</span>
              </div>
              {workout.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{workout.duration}</span>
                </div>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        {workout.notes && (
          <CardContent>
            <p className="whitespace-pre-wrap">{workout.notes}</p>
          </CardContent>
        )}
      </Card>

      <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        Ejercicios
      </h2>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No hay ejercicios registrados para este entrenamiento.</p>
            <Button className="mt-4" onClick={() => router.push("/workouts/add")}>
              Añadir nuevo entrenamiento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exercises.map((exercise) => {
            const sets = getExerciseSets(exercise.id)
            const hasSets = sets.length > 0

            return (
              <Card key={exercise.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <CardDescription>
                    {exercise.sets} {exercise.sets === 1 ? "serie" : "series"} •{" "}
                    {exercise.weight ? `${exercise.weight} kg` : "Sin peso"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={hasSets ? "sets" : "summary"}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="summary">Resumen</TabsTrigger>
                      <TabsTrigger value="sets" disabled={!hasSets}>
                        Series individuales
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary">
                      <div className="overflow-x-auto -mx-4 md:mx-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Series</TableHead>
                              <TableHead>Repeticiones</TableHead>
                              <TableHead>Peso (kg)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>{exercise.sets}</TableCell>
                              <TableCell>{exercise.reps}</TableCell>
                              <TableCell>{exercise.weight}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="sets">
                      {hasSets ? (
                        <div className="overflow-x-auto -mx-4 md:mx-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Serie</TableHead>
                                <TableHead>Repeticiones</TableHead>
                                <TableHead>Peso (kg)</TableHead>
                                <TableHead className="hidden sm:table-cell">RPE</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sets.map((set) => (
                                <TableRow key={set.id}>
                                  <TableCell>{set.set_number}</TableCell>
                                  <TableCell>{set.reps}</TableCell>
                                  <TableCell>{set.weight}</TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    {set.rpe ? (
                                      <Badge
                                        variant={set.rpe > 8 ? "destructive" : set.rpe > 6 ? "default" : "outline"}
                                      >
                                        {set.rpe}
                                      </Badge>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No hay datos detallados de series para este ejercicio
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {exercise.notes && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="font-medium mb-1">Notas:</p>
                      <p>{exercise.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={() => router.push("/workouts/add")}>Añadir nuevo entrenamiento</Button>
      </div>
    </div>
  )
}
