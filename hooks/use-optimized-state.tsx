"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { debounce } from "@/lib/utils"

// Hook personalizado para estados con actualización optimizada
export function useOptimizedState<T>(initialState: T | (() => T)) {
  const [state, setState] = useState<T>(initialState)

  // Referencia para mantener el valor actual sin causar re-renders
  const stateRef = useRef(state)

  // Actualizar la referencia cuando cambia el estado
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Función para obtener el valor actual sin causar re-renders
  const getState = useCallback(() => stateRef.current, [])

  // Función debounced para actualizar el estado
  const debouncedSetState = useCallback(
    debounce((value: T | ((prevState: T) => T)) => {
      setState(value)
    }, 100),
    [],
  )

  return [state, debouncedSetState, getState] as const
}

// Hook para manejar estados que se actualizan frecuentemente
export function useFrequentUpdates<T>(initialState: T | (() => T)) {
  const [state, setState] = useState<T>(initialState)

  // Función throttled para actualizar el estado
  const throttledSetState = useCallback((value: T | ((prevState: T) => T)) => {
    // Usar requestAnimationFrame para sincronizar con el ciclo de renderizado
    requestAnimationFrame(() => {
      setState(value)
    })
  }, [])

  return [state, throttledSetState] as const
}
