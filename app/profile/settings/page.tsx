"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Moon, Sun, Bell, Globe } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState("es")

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/profile")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Button>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-6">Configuración</h1>
      <p className="text-muted-foreground mb-8">Personaliza tu experiencia en la aplicación</p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              <Moon className="h-5 w-5" />
              Apariencia
            </CardTitle>
            <CardDescription>Personaliza el aspecto visual de la aplicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="theme-mode">Modo oscuro</Label>
                <p className="text-sm text-muted-foreground">Cambia entre modo claro y oscuro</p>
              </div>
              <Switch
                id="theme-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configura tus preferencias de notificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notificaciones push</Label>
                <p className="text-sm text-muted-foreground">Recibe recordatorios de entrenamientos</p>
              </div>
              <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Idioma
            </CardTitle>
            <CardDescription>Configura el idioma de la aplicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="language">Idioma de la aplicación</Label>
                <p className="text-sm text-muted-foreground">Actualmente solo disponible en español</p>
              </div>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2"
                disabled
              >
                <option value="es">Español</option>
                <option value="en">English (próximamente)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Button onClick={() => router.push("/profile")}>Guardar cambios</Button>
        </div>
      </div>
    </div>
  )
}
