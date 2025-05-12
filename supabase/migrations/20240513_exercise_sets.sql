-- Crear tabla para almacenar series individuales de ejercicios
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID REFERENCES exercises ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS exercise_sets_exercise_id_idx ON exercise_sets(exercise_id);

-- Habilitar RLS en la tabla
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para exercise_sets
DROP POLICY IF EXISTS "Users can view sets from their exercises" ON exercise_sets;
DROP POLICY IF EXISTS "Users can insert sets to their exercises" ON exercise_sets;
DROP POLICY IF EXISTS "Users can update sets from their exercises" ON exercise_sets;
DROP POLICY IF EXISTS "Users can delete sets from their exercises" ON exercise_sets;

CREATE POLICY "Users can view sets from their exercises" 
  ON exercise_sets FOR SELECT 
  USING (
    auth.uid() = (
      SELECT user_id FROM workouts 
      WHERE id = (
        SELECT workout_id FROM exercises 
        WHERE id = exercise_id
      )
    )
  );

CREATE POLICY "Users can insert sets to their exercises" 
  ON exercise_sets FOR INSERT 
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM workouts 
      WHERE id = (
        SELECT workout_id FROM exercises 
        WHERE id = exercise_id
      )
    )
  );

CREATE POLICY "Users can update sets from their exercises" 
  ON exercise_sets FOR UPDATE 
  USING (
    auth.uid() = (
      SELECT user_id FROM workouts 
      WHERE id = (
        SELECT workout_id FROM exercises 
        WHERE id = exercise_id
      )
    )
  );

CREATE POLICY "Users can delete sets from their exercises" 
  ON exercise_sets FOR DELETE 
  USING (
    auth.uid() = (
      SELECT user_id FROM workouts 
      WHERE id = (
        SELECT workout_id FROM exercises 
        WHERE id = exercise_id
      )
    )
  );

-- Añadir columna para almacenar el RPE (Rating of Perceived Exertion)
ALTER TABLE exercise_sets ADD COLUMN IF NOT EXISTS rpe SMALLINT;

-- Añadir columna para notas específicas de cada serie
ALTER TABLE exercise_sets ADD COLUMN IF NOT EXISTS notes TEXT;
