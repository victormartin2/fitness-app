"use client"

import { useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Loader2, Mail, Lock, AlertCircle } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const { signIn, resetPassword, supabase } = useSupabase()
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError("")

    try {
      if (showResetPassword) {
        await resetPassword(email)
        toast({
          title: "Correo enviado",
          description: "Se ha enviado un correo para restablecer tu contraseña",
        })
        setShowResetPassword(false)
      } else {
        try {
          await signIn(email, password)
        } catch (error) {
          if (error.message.includes("Email not confirmed")) {
            setLoginError("Tu correo electrónico no ha sido confirmado. Por favor, revisa tu bandeja de entrada.")
          } else {
            setLoginError(error.message)
          }
          throw error
        }
      }
    } catch (error) {
      console.error("Error:", error)
      // El error ya se muestra en el componente o en el toast desde signIn
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico",
      })
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      toast({
        title: "Correo enviado",
        description: "Hemos enviado un nuevo correo de confirmación",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
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
            <CardTitle className="text-2xl font-bold text-center">
              {showResetPassword ? "Restablecer contraseña" : "Iniciar sesión"}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {showResetPassword
                ? "Ingresa tu correo electrónico para recibir un enlace de restablecimiento"
                : "Ingresa tus credenciales para acceder a tu cuenta"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {loginError && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="flex justify-between items-center">
                    <span>{loginError}</span>
                    {loginError.includes("correo electrónico no ha sido confirmado") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendConfirmation}
                        className="ml-2 text-xs h-8"
                      >
                        Reenviar
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              )}

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
              {!showResetPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-base font-medium">
                      Contraseña
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm"
                      onClick={() => setShowResetPassword(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
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
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {showResetPassword ? "Enviar enlace de restablecimiento" : "Iniciar sesión"}
              </Button>
              {showResetPassword ? (
                <Button type="button" variant="link" className="text-sm" onClick={() => setShowResetPassword(false)}>
                  Volver al inicio de sesión
                </Button>
              ) : (
                <div className="text-center text-sm">
                  ¿No tienes una cuenta?{" "}
                  <Link href="/register" className="text-primary font-medium hover:underline">
                    Regístrate
                  </Link>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
