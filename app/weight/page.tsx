"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2, Plus, Scale, Trash, TrendingDown, TrendingUp } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ZAxis,
  Legend,
} from "recharts"

export default function WeightPage() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [weights, setWeights] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [timeRange, setTimeRange] = useState("all") // all, 6m, 3m, 1m
  const [stats, setStats] = useState({
    currentWeight: null,
    initialWeight: null,
    change: null,
    changePercentage: null,
    trend: null, // "up", "down", "stable"
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchWeights = async () => {
      try {
        const { data, error } = await supabase
          .from("weights")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: true })

        if (error) {
          throw error
        }

        // Formatear datos para el gráfico
        const formattedData = data.map((weight) => ({
          ...weight,
          date: new Date(weight.date).getTime(), // Convertir a timestamp para el gráfico
          formattedDate: format(new Date(weight.date), "dd MMM yyyy", { locale: es }),
        }))

        setWeights(formattedData || [])

        // Calcular estadísticas
        if (formattedData.length > 0) {
          const current = formattedData[formattedData.length - 1].weight
          const initial = formattedData[0].weight
          const change = current - initial
          const changePercentage = (change / initial) * 100

          setStats({
            currentWeight: current,
            initialWeight: initial,
            change: change,
            changePercentage: changePercentage,
            trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
          })
        }
      } catch (error) {
        console.error("Error fetching weights:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar los registros de peso",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWeights()
  }, [supabase, user, router, toast])

  const deleteWeight = async (id) => {
    setDeleting(true)
    try {
      const { error } = await supabase.from("weights").delete().eq("id", id)

      if (error) {
        throw error
      }

      setWeights(weights.filter((weight) => weight.id !== id))
      toast({
        title: "Registro eliminado",
        description: "El registro de peso ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting weight:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el registro de peso",
      })
    } finally {
      setDeleting(false)
    }
  }

  const getFilteredData = () => {
    if (timeRange === "all" || weights.length === 0) return weights

    const now = new Date()
    let monthsToSubtract = 1

    if (timeRange === "6m") monthsToSubtract = 6
    else if (timeRange === "3m") monthsToSubtract = 3

    const cutoffDate = subMonths(now, monthsToSubtract).getTime()
    return weights.filter((weight) => weight.date >= cutoffDate)
  }

  const filteredData = getFilteredData()

  // Calcular el rango del eje Y para el gráfico
  const getYAxisDomain = () => {
    if (filteredData.length === 0) return [0, 100]

    const weights = filteredData.map((item) => item.weight)
    const min = Math.min(...weights)
    const max = Math.max(...weights)

    // Añadir un margen del 5% arriba y abajo
    const margin = (max - min) * 0.05
    return [Math.max(0, min - margin), max + margin]
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seguimiento de Peso</h1>
        <Link href="/weight/add">
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Añadir peso</span>
            <span className="sm:hidden">Añadir</span>
          </Button>
        </Link>
      </div>

      {weights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Peso actual</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                {stats.currentWeight ? `${stats.currentWeight} kg` : "Sin datos"}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cambio desde el inicio</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {stats.change !== null && (
                  <>
                    {stats.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    ) : stats.trend === "down" ? (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    ) : null}
                    <span
                      className={stats.trend === "up" ? "text-red-500" : stats.trend === "down" ? "text-green-500" : ""}
                    >
                      {stats.change > 0 ? "+" : ""}
                      {stats.change.toFixed(1)} kg
                    </span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cambio porcentual</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {stats.changePercentage !== null && (
                  <>
                    {stats.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    ) : stats.trend === "down" ? (
                      <TrendingDown className="h-5 w-5 text-green-500" />
                    ) : null}
                    <span
                      className={stats.trend === "up" ? "text-red-500" : stats.trend === "down" ? "text-green-500" : ""}
                    >
                      {stats.changePercentage > 0 ? "+" : ""}
                      {stats.changePercentage.toFixed(1)}%
                    </span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs defaultValue="chart" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="table">Tabla</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Evolución del peso
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={timeRange === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("all")}
                  >
                    Todo
                  </Button>
                  <Button
                    variant={timeRange === "6m" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("6m")}
                  >
                    6M
                  </Button>
                  <Button
                    variant={timeRange === "3m" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("3m")}
                  >
                    3M
                  </Button>
                  <Button
                    variant={timeRange === "1m" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange("1m")}
                  >
                    1M
                  </Button>
                </div>
              </div>
              <CardDescription>Seguimiento de tu peso a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Scale className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-medium">No hay datos suficientes</h3>
                  <p className="mb-6 text-muted-foreground">Añade al menos dos registros de peso para ver el gráfico</p>
                </div>
              ) : (
                <div className="h-[300px] md:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        name="Fecha"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(timestamp) => format(new Date(timestamp), "dd/MM")}
                        label={{ value: "Fecha", position: "insideBottomRight", offset: -10 }}
                      />
                      <YAxis
                        dataKey="weight"
                        name="Peso"
                        unit=" kg"
                        domain={getYAxisDomain()}
                        label={{ value: "Peso (kg)", angle: -90, position: "insideLeft" }}
                      />
                      <ZAxis range={[60, 60]} />
                      <Tooltip
                        formatter={(value, name) => [value + (name === "Peso" ? " kg" : ""), name]}
                        labelFormatter={(label) => format(new Date(label), "dd MMMM yyyy", { locale: es })}
                        cursor={{ strokeDasharray: "3 3" }}
                      />
                      <Legend />
                      <Scatter name="Peso" data={filteredData} fill="#8884d8" line shape="circle" />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        data={filteredData}
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Historial de peso
              </CardTitle>
              <CardDescription>Registro de tus mediciones de peso a lo largo del tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              {weights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Scale className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-medium">No hay registros de peso</h3>
                  <p className="mb-6 text-muted-foreground">
                    Comienza a registrar tu peso para hacer un seguimiento de tu progreso
                  </p>
                  <Link href="/weight/add">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Añadir primer registro
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Peso (kg)</TableHead>
                        <TableHead>Notas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...weights].reverse().map((weight) => (
                        <TableRow key={weight.id}>
                          <TableCell className="font-medium">{weight.formattedDate}</TableCell>
                          <TableCell className="text-right">{weight.weight}</TableCell>
                          <TableCell className="max-w-xs truncate">{weight.notes || "-"}</TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive/90"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente este registro de
                                    peso.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteWeight(weight.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleting}
                                  >
                                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
