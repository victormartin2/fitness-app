"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Definir las credenciales de Supabase directamente
const supabaseUrl = "https://wvsmchggfffcganqvxcd.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2c21jaGdnZmZmY2dhbnF2eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzA2NTQsImV4cCI6MjA2MjYwNjY1NH0.MuKe_ySm80ESTXI4LHO6Bg4_z3J2gEowwjERRD30txU"

// Definir el tipo para el contexto
type SupabaseContextType = {
  supabase: any
  user: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
}

// Crear el contexto con un valor inicial no nulo
const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
})

export function SupabaseProvider({ children }) {
  // Inicializar el cliente de Supabase inmediatamente
  const [supabase] = useState(() =>
    createClientComponentClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    }),
  )

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Función para crear el perfil del usuario si no existe
  const createUserProfile = async (userId, name = "") => {
    try {
      // Verificar si el perfil ya existe
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError && !existingProfile) {
        // Si no existe, crear uno nuevo
        const { error: insertError } = await supabase.from("profiles").insert([
          {
            id: userId,
            name: name || "Usuario",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (insertError) {
          console.error("Error creating profile:", insertError)
          return false
        }
        return true
      }
      return true
    } catch (error) {
      console.error("Error in createUserProfile:", error)
      return false
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)

          // Intentar crear el perfil del usuario si no existe
          const profileCreated = await createUserProfile(session.user.id, session.user.user_metadata?.name || "")

          if (!profileCreated) {
            console.warn("No se pudo crear el perfil del usuario")
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error getting session:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)

        // Crear perfil cuando el usuario inicia sesión
        if (event === "SIGNED_IN") {
          await createUserProfile(session.user.id, session.user.user_metadata?.name || "")
        }
      } else {
        setUser(null)
      }
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const signIn = async (email, password) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          // Si el correo no está confirmado, ofrecer reenviar el correo
          toast({
            variant: "destructive",
            title: "Correo no confirmado",
            description:
              "Por favor, confirma tu correo electrónico para iniciar sesión. ¿Quieres que te enviemos otro correo de confirmación?",
            action: (
              <button
                onClick={async () => {
                  await supabase.auth.resend({
                    type: "signup",
                    email,
                    options: {
                      emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                  })
                  toast({
                    title: "Correo enviado",
                    description: "Hemos enviado un nuevo correo de confirmación",
                  })
                }}
                className="bg-primary text-white px-3 py-1 rounded-md text-xs"
              >
                Reenviar
              </button>
            ),
          })
        } else {
          throw error
        }
        return
      }

      // Crear perfil si no existe
      if (data?.user) {
        await createUserProfile(data.user.id, data.user.user_metadata?.name || "")
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error signing in:", error)
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message,
      })
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // Si el usuario se creó correctamente, crear un perfil
      if (data?.user) {
        await createUserProfile(data.user.id, name)
      }

      toast({
        title: "Registro exitoso",
        description:
          "Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.",
        duration: 6000,
      })

      // Redirigir a una página de confirmación en lugar de la página de inicio de sesión
      router.push("/auth/check-email")
    } catch (error) {
      console.error("Error signing up:", error)
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message,
      })
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Correo enviado",
        description: "Se ha enviado un correo para restablecer tu contraseña",
      })
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  const updatePassword = async (password) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    }
  }

  const value = {
    supabase,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("useSupabase debe ser usado dentro de un SupabaseProvider")
  }
  return context
}
