"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Mail, ArrowRight } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function CheckEmailPage() {
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Verifica tu correo electrónico</CardTitle>
            <CardDescription className="text-center text-base">
              Hemos enviado un correo de confirmación a tu dirección de email. Por favor, revisa tu bandeja de entrada y
              haz clic en el enlace para activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">¿No has recibido el correo?</h3>
              <ul className="space-y-2 text-sm">
                <li>• Revisa tu carpeta de spam o correo no deseado</li>
                <li>• Asegúrate de que la dirección de correo sea correcta</li>
                <li>• El correo puede tardar unos minutos en llegar</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Link href="/login" className="w-full">
              <Button className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                Volver a iniciar sesión
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="text-center text-sm">
              ¿Necesitas ayuda?{" "}
              <Link href="/contact" className="text-primary font-medium hover:underline">
                Contacta con soporte
              </Link>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
