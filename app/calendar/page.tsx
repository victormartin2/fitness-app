"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, ArrowLeft, CalendarIcon, ChevronLeft, ChevronRight, Scale, Dumbbell } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export default function CalendarPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [weights, setWeights] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [dayEvents, setDayEvents] = useState({ weights: [], workouts: [] })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)

        // Fetch weights for the current month
        const { data: weightsData, error: weightsError } = await supabase
          .from("weights")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", format(start, "yyyy-MM-dd"))
          .lte("date", format(end, "yyyy-MM-dd"))

        if (weightsError) {
          throw weightsError
        }

        setWeights(weightsData || [])

        // Fetch workouts for the current month
        const { data: workoutsData, error: workoutsError } = await supabase
          .from("workouts")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", format(start, "yyyy-MM-dd"))
          .lte("date", format(end, "yyyy-MM-dd"))

        if (workoutsError) {
          throw workoutsError
        }

        setWorkouts(workoutsData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los datos del calendario",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, user, currentMonth, router, toast])

  useEffect(() => {
    if (selectedDate) {
      // Filter events for the selected date
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const dayWeights = weights.filter((w) => w.date === dateStr)
      const dayWorkouts = workouts.filter((w) => w.date === dateStr)
      setDayEvents({ weights: dayWeights, workouts: dayWorkouts })
    } else {
      setDayEvents({ weights: [], workouts: [] })
    }
  }, [selectedDate, weights, workouts])

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  const handleDayClick = (day) => {
    if (isSameDay(day, selectedDate)) {
      setSelectedDate(null)
    } else {
      setSelectedDate(day)
    }
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Calendario</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {format(currentMonth, "MMMM yyyy", { locale: es })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                  <div key={day} className="text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the first day of the month */}
                {Array.from({
                  length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() || 7 - 1,
                }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-14 rounded-md"></div>
                ))}

                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const hasWeight = weights.some((w) => w.date === dateStr)
                  const hasWorkout = workouts.some((w) => w.date === dateStr)

                  return (
                    <Button
                      key={day.toString()}
                      variant="ghost"
                      className={cn(
                        "h-14 flex flex-col items-center justify-start pt-1 hover:bg-muted",
                        isToday(day) && "border-2 border-primary",
                        selectedDate && isSameDay(day, selectedDate) && "bg-muted",
                      )}
                      onClick={() => handleDayClick(day)}
                    >
                      <span className={cn("text-sm", isToday(day) && "font-bold text-primary")}>
                        {format(day, "d")}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {hasWeight && <Scale className="h-3 w-3 text-blue-500" />}
                        {hasWorkout && <Dumbbell className="h-3 w-3 text-green-500" />}
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : "Selecciona una fecha"}
              </CardTitle>
              <CardDescription>
                {selectedDate ? "Actividades para este día" : "Haz clic en un día para ver sus actividades"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-6">
                  {dayEvents.weights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
                        <Scale className="h-4 w-4 text-blue-500" />
                        Registros de peso
                      </h3>
                      <ul className="space-y-2">
                        {dayEvents.weights.map((weight) => (
                          <li key={weight.id} className="p-3 bg-muted/50 rounded-md">
                            <div className="font-medium">{weight.weight} kg</div>
                            {weight.notes && <div className="text-sm text-muted-foreground mt-1">{weight.notes}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {dayEvents.workouts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium flex items-center gap-2 mb-3">
                        <Dumbbell className="h-4 w-4 text-green-500" />
                        Entrenamientos
                      </h3>
                      <ul className="space-y-2">
                        {dayEvents.workouts.map((workout) => (
                          <li
                            key={workout.id}
                            className="p-3 bg-muted/50 rounded-md cursor-pointer hover:bg-muted"
                            onClick={() => router.push(`/workouts/${workout.id}`)}
                          >
                            <div className="font-medium">{workout.name}</div>
                            {workout.duration && (
                              <div className="text-sm text-muted-foreground mt-1">Duración: {workout.duration}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {dayEvents.weights.length === 0 && dayEvents.workouts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay actividades registradas para este día
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Selecciona un día en el calendario para ver sus actividades
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
