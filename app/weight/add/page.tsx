"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export default function AddWeightPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()

  const [date, setDate] = useState(new Date())
  const [weight, setWeight] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!weight) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingresa tu peso",
      })
      return
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes iniciar sesión para registrar tu peso",
      })
      return
    }

    setIsLoading(true)

    try {
      // Insertar con el user_id explícito
      const { error } = await supabase.from("weights").insert({
        user_id: user.id,
        date: date.toISOString().split("T")[0],
        weight: Number.parseFloat(weight),
        notes,
      })

      if (error) throw error

      toast({
        title: "Peso registrado",
        description: "Tu peso ha sido registrado correctamente",
      })

      router.push("/weight")
    } catch (error) {
      console.error("Error al guardar peso:", error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el registro de peso",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-card/50 to-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">Registrar peso</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa tu peso actual para seguir tu progreso
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-base font-medium">
                Fecha
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 border-2",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
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
              <Label htmlFor="weight" className="text-base font-medium">
                Peso (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="70.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                className="h-12 text-base border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-medium">
                Notas (opcional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Añade notas sobre tu peso, como factores que pueden haberlo afectado"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] border-2"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Guardar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
