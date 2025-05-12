import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Dumbbell, LineChart, Scale, User, ChevronRight, BarChart3, Activity } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span>FitTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm" className="h-10 px-4 border-2">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="h-10 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-background/80 dark:from-background dark:to-background/90">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                  Seguimiento de Peso y Entrenamientos Personales
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl">
                  Registra tu progreso, visualiza tus resultados y alcanza tus objetivos fitness.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-12 px-6 text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                  >
                    Comenzar ahora
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-6 text-base border-2">
                    Iniciar sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 lg:grid-cols-3 items-center">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Scale className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Seguimiento de Peso</h3>
                  <p className="text-muted-foreground text-lg">
                    Registra tu peso diario y visualiza tu progreso con gráficas detalladas.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Dumbbell className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Registro de Entrenamientos</h3>
                  <p className="text-muted-foreground text-lg">
                    Guarda tus ejercicios, series, repeticiones y pesos para cada sesión.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Análisis de Progreso</h3>
                  <p className="text-muted-foreground text-lg">
                    Visualiza tus récords personales y mejoras a lo largo del tiempo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Características principales
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Todo lo que necesitas para seguir tu progreso fitness
                </p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col space-y-3 bg-card p-6 rounded-xl shadow-sm border-2 border-border/50 hover:border-primary/50 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Seguimiento diario</h3>
                <p className="text-muted-foreground">
                  Registra tu peso y entrenamientos diariamente para mantener un seguimiento constante.
                </p>
              </div>

              <div className="flex flex-col space-y-3 bg-card p-6 rounded-xl shadow-sm border-2 border-border/50 hover:border-primary/50 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Gráficas detalladas</h3>
                <p className="text-muted-foreground">
                  Visualiza tu progreso con gráficas interactivas que muestran tu evolución.
                </p>
              </div>

              <div className="flex flex-col space-y-3 bg-card p-6 rounded-xl shadow-sm border-2 border-border/50 hover:border-primary/50 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Perfil personalizado</h3>
                <p className="text-muted-foreground">
                  Configura tu perfil con tus datos personales y objetivos fitness.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 md:py-12 bg-muted/30">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span>FitTrack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FitTrack. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
