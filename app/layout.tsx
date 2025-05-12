import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SupabaseProvider } from "@/components/supabase-provider"
import { Toaster } from "@/components/ui/toaster"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { Header } from "@/components/layout/header"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>FitTrack - Seguimiento de Fitness</title>
        <meta name="description" content="Aplicación para seguimiento de entrenamientos y progreso físico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <Header />
            <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
            <Toaster />
            <PerformanceMonitor />
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
