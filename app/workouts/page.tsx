"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Plus, Dumbbell, ArrowLeft, Trash, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
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

export default function WorkoutsPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchWorkouts = async () => {
      try {
        const { data, error } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false })

        if (error) {
          throw error
        }

        setWorkouts(data || [])
      } catch (error) {
        console.error("Error fetching workouts:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los entrenamientos",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [supabase, user, router, toast])

  const deleteWorkout = async (id) => {
    setDeleting(true)
    try {
      // Primero eliminar los ejercicios asociados
      const { error: exercisesError } = await supabase.from("exercises").delete().eq("workout_id", id)

      if (exercisesError) {
        throw exercisesError
      }

      // Luego eliminar el entrenamiento
      const { error } = await supabase.from("workouts").delete().eq("id", id)

      if (error) {
        throw error
      }

      setWorkouts(workouts.filter((workout) => workout.id !== id))
      toast({
        title: "Entrenamiento eliminado",
        description: "El entrenamiento ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting workout:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el entrenamiento",
      })
    } finally {
      setDeleting(false)
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
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="mb-4 md:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1 md:gap-2 px-2 md:px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Entrenamientos</h1>
        </div>
        <Link href="/workouts/add">
          <Button className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Añadir entrenamiento</span>
            <span className="sm:hidden">Añadir</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Dumbbell className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Historial de entrenamientos
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Registro de tus sesiones de entrenamiento</CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
              <Dumbbell className="mb-3 md:mb-4 h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg md:text-xl font-medium">No hay entrenamientos registrados</h3>
              <p className="mb-5 md:mb-6 text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Comienza a registrar tus entrenamientos para hacer un seguimiento de tu progreso
              </p>
              <Link href="/workouts/add">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir primer entrenamiento
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Duración</TableHead>
                    <TableHead className="hidden md:table-cell">Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workouts.map((workout) => (
                    <TableRow key={workout.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(workout.date), "dd MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="max-w-[120px] md:max-w-xs truncate">{workout.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{workout.duration || "-"}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">{workout.notes || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-primary hover:text-primary/90"
                            onClick={() => router.push(`/workouts/${workout.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalles</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[90vw] md:max-w-md">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente este entrenamiento y
                                  todos sus ejercicios asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteWorkout(workout.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deleting}
                                >
                                  {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
