import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Permitir acceso a la ruta de callback de autenticación
  if (req.nextUrl.pathname.startsWith("/auth/callback")) {
    return res
  }

  // Check auth condition
  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register") ||
    req.nextUrl.pathname.startsWith("/reset-password") ||
    req.nextUrl.pathname.startsWith("/auth/check-email") ||
    req.nextUrl.pathname === "/"

  const isProtectedRoute =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/weight") ||
    req.nextUrl.pathname.startsWith("/workouts") ||
    req.nextUrl.pathname.startsWith("/profile")

  // If user is not signed in and the route is protected, redirect to login
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // If user is signed in and the route is auth, redirect to dashboard
  if (session && isAuthRoute && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}
