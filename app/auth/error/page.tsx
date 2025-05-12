"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, AlertTriangle } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const errorMessage = searchParams.get("message") || "Ha ocurrido un error durante la autenticación"

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/80 dark:from-background dark:to-background/90">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span>FitTrack</span>
          </Link>
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-gradient-to-br from-card/50 to-card">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-2">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Error de autenticación</CardTitle>
            <CardDescription className="text-center text-base">{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">¿Qué puedes hacer?</h3>
              <ul className="space-y-2 text-sm">
                <li>• Intenta iniciar sesión nuevamente</li>
                <li>• Verifica que tu cuenta esté correctamente configurada</li>
                <li>• Si el problema persiste, contacta con soporte</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex gap-4 w-full">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
