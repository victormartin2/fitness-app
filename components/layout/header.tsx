"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { BarChart3, Calendar, Dumbbell, Home, Scale } from "lucide-react"

export function Header() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      href: "/weight",
      label: "Peso",
      icon: Scale,
      active: pathname === "/weight" || pathname.startsWith("/weight/"),
    },
    {
      href: "/workouts",
      label: "Entrenamientos",
      icon: Dumbbell,
      active: pathname === "/workouts" || pathname.startsWith("/workouts/"),
    },
    {
      href: "/stats",
      label: "Estadísticas",
      icon: BarChart3,
      active: pathname === "/stats",
    },
    {
      href: "/calendar",
      label: "Calendario",
      icon: Calendar,
      active: pathname === "/calendar",
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">FitTrack</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center transition-colors hover:text-foreground/80",
                  route.active ? "text-foreground" : "text-foreground/60",
                )}
              >
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center md:hidden">
          <Link href="/dashboard" className="mr-2">
            <span className="font-bold text-lg">FitTrack</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center md:hidden">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant="ghost"
                size="icon"
                asChild
                className={cn("text-foreground/60 hover:text-foreground/80", route.active && "text-foreground")}
              >
                <Link href={route.href}>
                  <route.icon className="h-5 w-5" />
                  <span className="sr-only">{route.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center">
            <ModeToggle />
            <UserNav />
          </div>
        </div>
      </div>
    </header>
  )
}
