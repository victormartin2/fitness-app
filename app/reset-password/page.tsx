"use client"

import { useState } from "react"
import Link from "next/link"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Loader2 } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { updatePassword } = useSupabase()

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
    await updatePassword(password)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Dumbbell className="h-5 w-5" />
            <span>FitTrack</span>
          </Link>
          <ModeToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Restablecer contraseña</CardTitle>
            <CardDescription>Crea una nueva contraseña para tu cuenta</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar nueva contraseña
              </Button>
              <div className="text-center text-sm">
                <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                  Volver al inicio de sesión
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
