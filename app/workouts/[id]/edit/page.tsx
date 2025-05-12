"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2, Plus, Trash, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
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
import React from "react"

export default function EditWorkoutPage({ params }) {
  const id = React.use(params).id
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  const [date, setDate] = useState(new Date())
  const [name, setName] = useState("")
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [exercises, setExercises] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedExercise, setExpandedExercise] = useState(-1)
  const [originalWorkout, setOriginalWorkout] = useState(null)
  const [exerciseSets, setExerciseSets] = useState({})
  const [deletedExercises, setDeletedExercises] = useState([])

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
          toast({
            variant: "destructive",
            title: "Error",
            description: "ID de entrenamiento inválido",
          })
          router.push("/workouts")
          return
        }

        // Obtener detalles del entrenamiento
        const { data: workoutData, error: workoutError } = await supabase
          .from("workouts")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)

        if (workoutError) throw workoutError

        // Verificar si se encontró el entrenamiento
        if (!workoutData || workoutData.length === 0) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No se encontró el entrenamiento o no tienes permiso para editarlo",
          })
          router.push("/workouts")
          return
        }

        // Usar el primer resultado
        const workout = workoutData[0]
        setOriginalWorkout(workout)

        // Establecer los valores del formulario
        setName(workout.name)
        setNotes(workout.notes || "")
        setDuration(workout.duration || "")
        setDate(parseISO(workout.date))

        // Obtener ejercicios del entrenamiento
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .eq("workout_id", id)
          .order("created_at", { ascending: true })

        if (exercisesError) throw exercisesError

        // Obtener las series individuales para cada ejercicio
        if (exercisesData && exercisesData.length > 0) {
          const exerciseIds = exercisesData.map((ex) => ex.id)

          const { data: setsData, error: setsError } = await supabase
            .from("exercise_sets")
            .select("*")
            .in("exercise_id", exerciseIds)
            .order("set_number", { ascending: true })

          if (setsError) throw setsError

          // Organizar las series por ejercicio
          const setsByExercise = {}
          setsData?.forEach((set) => {
            if (!setsByExercise[set.exercise_id]) {
              setsByExercise[set.exercise_id] = []
            }
            setsByExercise[set.exercise_id].push(set)
          })

          setExerciseSets(setsByExercise)

          // Preparar los ejercicios para el formulario
          const formattedExercises = exercisesData.map((exercise) => {
            const sets = setsByExercise[exercise.id] || []

            // Si no hay series individuales, crear una basada en los promedios
            if (sets.length === 0) {
              return {
                id: exercise.id,
                name: exercise.name,
                sets: Array(exercise.sets)
                  .fill()
                  .map(() => ({
                    reps: exercise.reps.toString(),
                    weight: exercise.weight.toString(),
                    rpe: null,
                  })),
                notes: exercise.notes || "",
              }
            }

            // Usar las series individuales
            return {
              id: exercise.id,
              name: exercise.name,
              sets: sets.map((set) => ({
                id: set.id,
                reps: set.reps.toString(),
                weight: set.weight.toString(),
                rpe: set.rpe,
              })),
              notes: exercise.notes || "",
            }
          })

          setExercises(formattedExercises)
        } else {
          setExercises([])
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching workout details:", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Error al cargar los detalles: ${err.message}`,
        })
        router.push("/workouts")
      }
    }

    fetchWorkoutDetails()
  }, [id, router, supabase, toast, user])

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: "",
        sets: [{ reps: "", weight: "", rpe: null }],
        notes: "",
      },
    ])
    // Automatically expand the new exercise
    setExpandedExercise(exercises.length)
  }

  const removeExercise = (index) => {
    const updatedExercises = [...exercises]
    const exerciseToRemove = updatedExercises[index]

    // Si el ejercicio tiene un ID, añadirlo a la lista de eliminados
    if (exerciseToRemove.id) {
      setDeletedExercises([...deletedExercises, exerciseToRemove.id])
    }

    updatedExercises.splice(index, 1)
    setExercises(updatedExercises)

    // If we removed the expanded exercise, collapse all
    if (expandedExercise === index) {
      setExpandedExercise(-1)
    } else if (expandedExercise > index) {
      // Adjust the expanded index if we removed an exercise before it
      setExpandedExercise(expandedExercise - 1)
    }
  }

  const updateExerciseName = (index, value) => {
    const updatedExercises = [...exercises]
    updatedExercises[index].name = value
    setExercises(updatedExercises)
  }

  const updateExerciseNotes = (index, value) => {
    const updatedExercises = [...exercises]
    updatedExercises[index].notes = value
    setExercises(updatedExercises)
  }

  const addSet = (exerciseIndex) => {
    const updatedExercises = [...exercises]
    // Copy the last set's values for convenience
    const lastSet = updatedExercises[exerciseIndex].sets[updatedExercises[exerciseIndex].sets.length - 1]
    updatedExercises[exerciseIndex].sets.push({
      reps: lastSet.reps,
      weight: lastSet.weight,
      rpe: lastSet.rpe,
    })
    setExercises(updatedExercises)
  }

  const removeSet = (exerciseIndex, setIndex) => {
    const updatedExercises = [...exercises]
    if (updatedExercises[exerciseIndex].sets.length > 1) {
      // Si la serie tiene un ID, podríamos manejar su eliminación aquí
      updatedExercises[exerciseIndex].sets.splice(setIndex, 1)
      setExercises(updatedExercises)
    }
  }

  const updateSetValue = (exerciseIndex, setIndex, field, value) => {
    const updatedExercises = [...exercises]

    // Si el campo es rpe y el valor es null o undefined, establecer a null explícitamente
    if (field === "rpe" && (value === null || value === undefined)) {
      updatedExercises[exerciseIndex].sets[setIndex][field] = null
    } else {
      updatedExercises[exerciseIndex].sets[setIndex][field] = value
    }

    setExercises(updatedExercises)
  }

  const toggleExercise = (index) => {
    setExpandedExercise(expandedExercise === index ? -1 : index)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingresa un nombre para el entrenamiento",
      })
      return
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para editar un entrenamiento",
      })
      return
    }

    setIsLoading(true)

    try {
      // Actualizar el entrenamiento
      const { data: updatedWorkout, error: workoutError } = await supabase
        .from("workouts")
        .update({
          date: date.toISOString().split("T")[0],
          name,
          duration,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()

      if (workoutError) throw workoutError

      // Asegurarse de que se actualizó correctamente
      if (!updatedWorkout || updatedWorkout.length === 0) {
        throw new Error("No se pudo actualizar el entrenamiento")
      }

      // Eliminar ejercicios marcados para eliminación
      if (deletedExercises.length > 0) {
        const { error: deleteError } = await supabase.from("exercises").delete().in("id", deletedExercises)

        if (deleteError) throw deleteError
      }

      // Procesar cada ejercicio
      for (const exercise of exercises) {
        // Filtrar series vacías
        const validSets = exercise.sets.filter((set) => {
          // Convertir a números para validación
          const reps = Number.parseInt(set.reps) || 0
          const weight = Number.parseFloat(set.weight) || 0
          // Considerar válido si al menos uno tiene valor
          return reps > 0 || weight > 0
        })

        if (validSets.length === 0) {
          // Si no hay series válidas, añadir al menos una serie por defecto
          validSets.push({ reps: "0", weight: "0", rpe: null })
        }

        // Calcular valores promedio para el resumen del ejercicio
        const totalSets = validSets.length

        // Asegurarse de que los valores sean números antes de calcular promedios
        const validReps = validSets.map((set) => Number.parseInt(set.reps) || 0)
        const validWeights = validSets.map((set) => Number.parseFloat(set.weight) || 0)

        // Calcular el promedio de repeticiones (redondeado al entero más cercano)
        const avgReps =
          validReps.length > 0 ? Math.round(validReps.reduce((sum, reps) => sum + reps, 0) / validReps.length) : 0

        // Calcular el promedio de peso (con un decimal)
        const avgWeight =
          validWeights.length > 0
            ? Math.round((validWeights.reduce((sum, weight) => sum + weight, 0) / validWeights.length) * 10) / 10
            : 0

        if (exercise.id) {
          // Actualizar ejercicio existente
          const { error: exerciseError } = await supabase
            .from("exercises")
            .update({
              name: exercise.name,
              sets: totalSets,
              reps: avgReps,
              weight: avgWeight,
              notes: exercise.notes || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", exercise.id)

          if (exerciseError) throw exerciseError

          // Eliminar series existentes y crear nuevas
          const { error: deleteSetError } = await supabase.from("exercise_sets").delete().eq("exercise_id", exercise.id)

          if (deleteSetError) throw deleteSetError

          // Insertar nuevas series
          const setsToInsert = validSets.map((set, index) => ({
            exercise_id: exercise.id,
            set_number: index + 1,
            reps: Number.parseInt(set.reps) || 0,
            weight: Number.parseFloat(set.weight) || 0,
            rpe: set.rpe !== null ? set.rpe : null,
          }))

          const { error: insertSetError } = await supabase.from("exercise_sets").insert(setsToInsert)

          if (insertSetError) throw insertSetError
        } else {
          // Insertar nuevo ejercicio
          const { data: exerciseData, error: exerciseError } = await supabase
            .from("exercises")
            .insert({
              workout_id: id,
              name: exercise.name,
              sets: totalSets,
              reps: avgReps,
              weight: avgWeight,
              notes: exercise.notes || null,
            })
            .select()

          if (exerciseError) throw exerciseError

          if (exerciseData && exerciseData.length > 0) {
            const exerciseId = exerciseData[0].id

            // Insertar series
            const setsToInsert = validSets.map((set, index) => ({
              exercise_id: exerciseId,
              set_number: index + 1,
              reps: Number.parseInt(set.reps) || 0,
              weight: Number.parseFloat(set.weight) || 0,
              rpe: set.rpe !== null ? set.rpe : null,
            }))

            const { error: setsError } = await supabase.from("exercise_sets").insert(setsToInsert)

            if (setsError) throw setsError
          }
        }
      }

      toast({
        title: "Entrenamiento actualizado",
        description: "Tu entrenamiento ha sido actualizado correctamente",
      })

      router.push(`/workouts/${id}`)
    } catch (error) {
      console.error("Error al actualizar entrenamiento:", error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "No se pudo actualizar el entrenamiento",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 sm:py-8 sm:px-0">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              Cancelar edición
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Se perderán todos los cambios realizados. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar editando</AlertDialogCancel>
              <AlertDialogAction onClick={() => router.push(`/workouts/${id}`)}>Descartar cambios</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-card/50 to-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl sm:text-2xl font-bold">Editar entrenamiento</CardTitle>
          <CardDescription className="text-muted-foreground">
            Modifica los detalles de tu sesión de entrenamiento
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm sm:text-base font-medium">
                  Fecha
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10 sm:h-12 border-2",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="rounded-md border-0"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base font-medium">
                  Nombre del entrenamiento
                </Label>
                <Input
                  id="name"
                  placeholder="Ej: Piernas, Pecho y tríceps, etc."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 sm:h-12 text-sm sm:text-base border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm sm:text-base font-medium">
                  Duración (opcional)
                </Label>
                <Input
                  id="duration"
                  placeholder="Ej: 45 minutos, 1 hora, etc."
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-10 sm:h-12 text-sm sm:text-base border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm sm:text-base font-medium">
                  Notas (opcional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Añade notas sobre tu entrenamiento"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[40px] sm:min-h-[48px] border-2 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold">Ejercicios</h3>
                <Button
                  type="button"
                  onClick={addExercise}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-2 text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  Añadir ejercicio
                </Button>
              </div>

              {exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="space-y-4 p-3 sm:p-5 border-2 rounded-lg bg-card/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExercise(exerciseIndex)}
                        className="p-1 h-auto"
                      >
                        {expandedExercise === exerciseIndex ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <h4 className="font-semibold text-base sm:text-lg">Ejercicio {exerciseIndex + 1}</h4>
                      {exercise.sets.length > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {exercise.sets.length} {exercise.sets.length === 1 ? "serie" : "series"}
                        </Badge>
                      )}
                    </div>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(exerciseIndex)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 p-1 h-auto"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`exercise-name-${exerciseIndex}`} className="text-sm sm:text-base font-medium">
                        Nombre del ejercicio
                      </Label>
                      <Input
                        id={`exercise-name-${exerciseIndex}`}
                        placeholder="Ej: Sentadillas, Press de banca, etc."
                        value={exercise.name}
                        onChange={(e) => updateExerciseName(exerciseIndex, e.target.value)}
                        className="h-10 text-sm sm:text-base border-2"
                      />
                    </div>

                    {expandedExercise === exerciseIndex && (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Series</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSet(exerciseIndex)}
                              className="h-7 text-xs px-2 py-1"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Añadir serie
                            </Button>
                          </div>

                          {exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className="space-y-3 bg-background/50 p-3 rounded-md">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                    {setIndex + 1}
                                  </div>
                                  <span className="text-sm font-medium">Serie {setIndex + 1}</span>
                                </div>
                                {exercise.sets.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                    className="p-1 h-auto text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                  >
                                    <Trash className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label htmlFor={`exercise-${exerciseIndex}-set-${setIndex}-reps`} className="text-xs">
                                    Repeticiones
                                  </Label>
                                  <Input
                                    id={`exercise-${exerciseIndex}-set-${setIndex}-reps`}
                                    type="number"
                                    placeholder="Reps"
                                    value={set.reps}
                                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, "reps", e.target.value)}
                                    className="h-9 text-sm border"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label
                                    htmlFor={`exercise-${exerciseIndex}-set-${setIndex}-weight`}
                                    className="text-xs"
                                  >
                                    Peso (kg)
                                  </Label>
                                  <Input
                                    id={`exercise-${exerciseIndex}-set-${setIndex}-weight`}
                                    type="number"
                                    step="0.5"
                                    placeholder="Peso"
                                    value={set.weight}
                                    onChange={(e) => updateSetValue(exerciseIndex, setIndex, "weight", e.target.value)}
                                    className="h-9 text-sm border"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <Label
                                    htmlFor={`exercise-${exerciseIndex}-set-${setIndex}-rpe`}
                                    className="text-xs flex items-center"
                                  >
                                    RPE (opcional)
                                    <span className="ml-1 text-xs text-muted-foreground">(Esfuerzo percibido)</span>
                                  </Label>
                                  <span className="text-xs font-medium">{set.rpe || "No definido"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    id={`exercise-${exerciseIndex}-set-${setIndex}-rpe`}
                                    min={1}
                                    max={10}
                                    step={1}
                                    value={[set.rpe || 7]}
                                    onValueChange={(value) => updateSetValue(exerciseIndex, setIndex, "rpe", value[0])}
                                    className="flex-1"
                                    disabled={set.rpe === null}
                                  />
                                  <Button
                                    type="button"
                                    variant={set.rpe !== null ? "default" : "outline"}
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const updatedExercises = [...exercises]
                                      const currentSet = updatedExercises[exerciseIndex].sets[setIndex]
                                      if (currentSet.rpe === null) {
                                        currentSet.rpe = 7 // Valor por defecto
                                      } else {
                                        currentSet.rpe = null // Desactivar RPE
                                      }
                                      setExercises(updatedExercises)
                                    }}
                                  >
                                    {set.rpe !== null ? "Activado" : "Desactivado"}
                                  </Button>
                                </div>
                                {set.rpe !== null && (
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Fácil</span>
                                    <span>Máximo</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`exercise-notes-${exerciseIndex}`} className="text-sm font-medium">
                            Notas (opcional)
                          </Label>
                          <Textarea
                            id={`exercise-notes-${exerciseIndex}`}
                            placeholder="Añade notas sobre este ejercicio"
                            value={exercise.notes}
                            onChange={(e) => updateExerciseNotes(exerciseIndex, e.target.value)}
                            className="min-h-[40px] text-sm border"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
              Guardar cambios
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
