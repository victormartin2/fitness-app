"use client"

import { useEffect, useState } from "react"
import { throttle } from "@/lib/utils"

// Componente para monitorear el rendimiento de la aplicación
export function PerformanceMonitor() {
  const [fps, setFps] = useState(0)
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    let frameCount = 0
    let lastTime = performance.now()
    let animationFrameId: number

    // Función para calcular FPS
    const calculateFps = throttle(() => {
      const now = performance.now()
      const elapsed = now - lastTime

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / elapsed)
        setFps(currentFps)
        frameCount = 0
        lastTime = now

        // Obtener uso de memoria si está disponible
        if (window.performance && (performance as any).memory) {
          const memory = (performance as any).memory
          setMemoryUsage(Math.round(memory.usedJSHeapSize / (1024 * 1024)))
        }
      }

      frameCount++
      animationFrameId = requestAnimationFrame(calculateFps)
    }, 100)

    // Iniciar monitoreo
    animationFrameId = requestAnimationFrame(calculateFps)

    // Tecla para mostrar/ocultar monitor (Ctrl+Shift+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault()
        setIsVisible((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  if (!isVisible || process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-2 right-2 bg-black/80 text-white text-xs p-2 rounded z-50 font-mono">
      <div>FPS: {fps}</div>
      {memoryUsage !== null && <div>Memoria: {memoryUsage} MB</div>}
    </div>
  )
}
