"use client"

import { useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Loader2, Mail, Lock, User, Info } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useSupabase()
  const { toast } = useToast()

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return false
    }
    if (password.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validatePassword()) {
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password, name)
      // La redirección se maneja en el método signUp
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message || "Ha ocurrido un error durante el registro",
      })
    } finally {
      setIsLoading(false)
    }
  }

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
                <Dumbbell className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Crear cuenta</CardTitle>
            <CardDescription className="text-center text-base">
              Ingresa tus datos para registrarte en FitTrack
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <Alert className="bg-primary/10 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Después de registrarte, recibirás un correo para confirmar tu cuenta.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-medium">
                  Nombre
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 h-12 text-base border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12 text-base border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-12 text-base border-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base font-medium">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 h-12 text-base border-2"
                  />
                </div>
                {passwordError && <p className="text-sm text-destructive font-medium">{passwordError}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Registrarse
              </Button>
              <div className="text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Inicia sesión
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
