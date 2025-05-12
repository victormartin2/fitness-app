import { createClient } from '@supabase/supabase-js'

// Usar las credenciales proporcionadas
const supabaseUrl = 'https://wvsmchggfffcganqvxcd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2c21jaGdnZmZmY2dhbnF2eGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzA2NTQsImV4cCI6MjA2MjYwNjY1NH0.MuKe_ySm80ESTXI4LHO6Bg4_z3J2gEowwjERRD30txU'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Iniciando script para corregir políticas de seguridad RLS...')

// Script SQL para crear las tablas y políticas de seguridad
const sql = `
-- Crear tablas si no existen
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  name TEXT,
  duration TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  reps INTEGER NOT NULL,
  date DATE NOT NULL,
  workout_id UUID REFERENCES workouts ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;

-- Políticas para profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" 
  ON profiles 
  USING (auth.role() = 'service_role');

-- Políticas para weights
DROP POLICY IF EXISTS "Users can view their own weight entries" ON weights;
DROP POLICY IF EXISTS "Users can insert their own weight entries" ON weights;
DROP POLICY IF EXISTS "Users can update their own weight entries" ON weights;
DROP POLICY IF EXISTS "Users can delete their own weight entries" ON weights;

CREATE POLICY "Users can view their own weight entries" 
  ON weights FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weight entries" 
  ON weights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight entries" 
  ON weights FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight entries" 
  ON weights FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para workouts
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;

CREATE POLICY "Users can view their own workouts" 
  ON workouts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" 
  ON workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
  ON workouts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
  ON workouts FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas para exercises
DROP POLICY IF EXISTS "Users can view exercises from their workouts" ON exercises;
DROP POLICY IF EXISTS "Users can insert exercises to their workouts" ON exercises;
DROP POLICY IF EXISTS "Users can update exercises from their workouts" ON exercises;
DROP POLICY IF EXISTS "Users can delete exercises from their workouts" ON exercises;

CREATE POLICY "Users can view exercises from their workouts" 
  ON exercises FOR SELECT 
  USING (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));

CREATE POLICY "Users can insert exercises to their workouts" 
  ON exercises FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));

CREATE POLICY "Users can update exercises from their workouts" 
  ON exercises FOR UPDATE 
  USING (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));

CREATE POLICY "Users can delete exercises from their workouts" 
  ON exercises FOR DELETE 
  USING (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));

-- Políticas para personal_records
DROP POLICY IF EXISTS "Users can view their own personal records" ON personal_records;
DROP POLICY IF EXISTS "Users can insert their own personal records" ON personal_records;
DROP POLICY IF EXISTS "Users can update their own personal records" ON personal_records;
DROP POLICY IF EXISTS "Users can delete their own personal records" ON personal_records;

CREATE POLICY "Users can view their own personal records" 
  ON personal_records FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal records" 
  ON personal_records FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal records" 
  ON personal_records FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal records" 
  ON personal_records FOR DELETE 
  USING (auth.uid() = user_id);

-- Función para eliminar datos de usuario
CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all user data
  DELETE FROM personal_records WHERE user_id = auth.uid();
  DELETE FROM weights WHERE user_id = auth.uid();
  DELETE FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid());
  DELETE FROM workouts WHERE user_id = auth.uid();
  DELETE FROM profiles WHERE id = auth.uid();
END;
$$;
`

// Función para ejecutar el script SQL
async function executeSQL() {
  try {
    console.log('Ejecutando script SQL...')
    
    // Dividir el script en sentencias individuales
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          console.log(`Ejecutando: ${statement.trim().substring(0, 50)}...`)
          
          // Ejecutar cada sentencia SQL
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
          
          if (error) {
            console.log(`Error en consulta: ${error.message}`)
          } else {
            console.log('Consulta ejecutada correctamente')
          }
        } catch (stmtError) {
          console.error('Error al ejecutar sentencia:', stmtError)
        }
      }
    }
    
    console.log('Script SQL completado')
    console.log('IMPORTANTE: Si ves errores, deberás ejecutar este script manualmente en el SQL Editor de Supabase')
    console.log('Copia el script SQL y ejecútalo en: https://app.supabase.com/project/_/sql')
    
  } catch (error) {
    console.error('Error general:', error)
  }
}

// Ejecutar el script
executeSQL()
