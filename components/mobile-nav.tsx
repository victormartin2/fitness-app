"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dumbbell, Menu } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    {
      href: "/weight",
      label: "Peso",
      active: pathname === "/weight",
    },
    {
      href: "/workouts",
      label: "Entrenamientos",
      active: pathname === "/workouts",
    },
    {
      href: "/profile",
      label: "Perfil",
      active: pathname === "/profile",
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl" onClick={() => setOpen(false)}>
          <Dumbbell className="h-5 w-5" />
          <span>FitTrack</span>
        </Link>
        <nav className="flex flex-col gap-4 mt-8">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {route.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
