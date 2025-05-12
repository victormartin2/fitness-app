"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BarChart3, Dumbbell, Home, Scale, User } from "lucide-react"

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="h-4 w-4 mr-2" />,
      active: pathname === "/dashboard",
    },
    {
      href: "/weight",
      label: "Peso",
      icon: <Scale className="h-4 w-4 mr-2" />,
      active: pathname === "/weight" || pathname.startsWith("/weight/"),
    },
    {
      href: "/workouts",
      label: "Entrenamientos",
      icon: <Dumbbell className="h-4 w-4 mr-2" />,
      active: pathname === "/workouts" || pathname.startsWith("/workouts/"),
    },
    {
      href: "/stats",
      label: "Estadísticas",
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
      active: pathname === "/stats",
    },
    {
      href: "/profile",
      label: "Perfil",
      icon: <User className="h-4 w-4 mr-2" />,
      active: pathname === "/profile" || pathname.startsWith("/profile/"),
    },
  ]

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6 mx-6", className)} {...props}>
      <div className="mr-4 flex items-center">
        <Link href="/dashboard" className="flex items-center">
          <span className="font-bold text-xl">FitTrack</span>
        </Link>
      </div>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <span className="hidden md:flex items-center">
            {route.icon}
            {route.label}
          </span>
          <span className="md:hidden">{route.icon}</span>
        </Link>
      ))}
    </nav>
  )
}
