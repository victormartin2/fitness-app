import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error("Error processing auth callback:", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?message=${encodeURIComponent("Error al procesar la autenticación")}`,
      )
    }
  }

  // URL a la que redirigir después de la autenticación exitosa
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
}
