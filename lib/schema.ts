// Definición de esquemas para la base de datos
export interface Exercise {
  id?: string
  workout_id: string
  name: string
  sets: number
  reps: number
  weight: number
  notes?: string
  created_at?: string
}

export interface ExerciseSet {
  reps: number
  weight: number
}

export interface Workout {
  id?: string
  user_id: string
  date: string
  name: string
  duration?: string
  notes?: string
  created_at?: string
}

export interface Profile {
  id: string
  name?: string
  bio?: string
  created_at?: string
  updated_at?: string
}

export interface WeightRecord {
  id?: string
  user_id: string
  date: string
  weight: number
  notes?: string
  created_at?: string
}
