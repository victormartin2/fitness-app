import { createClient } from '@supabase/supabase-js'

// Usar las credenciales proporcionadas
const supabaseUrl = 'https://eyezpgphsqivgdzstuba.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZXpwZ3Boc3FpdmdkenN0dWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjk2MDMsImV4cCI6MjA2MjYwNTYwM30.WT0JrL4Ff063iaj87GmNhIaROkaPT5-YsBPsUkSGSpI'
const supabase = createClient(supabaseUrl, supabaseKey)

// Script SQL para crear las tablas
const sql = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weights table
CREATE TABLE IF NOT EXISTS weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  name TEXT,
  duration TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exercises table
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

-- Create personal records table
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

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Weights policies
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

-- Workouts policies
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

-- Exercises policies
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

-- Personal records policies
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

-- Function to delete all user data
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

// Ejecutar el script SQL
async function createTables() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error al ejecutar SQL:', error)
      
      // Intentar ejecutar como consulta directa si RPC falla
      console.log('Intentando ejecutar como consulta directa...')
      const { error: directError } = await supabase.from('_exec_sql').select('*').eq('query', sql).single()
      
      if (directError) {
        console.error('Error al ejecutar consulta directa:', directError)
        
        // Último intento: dividir y ejecutar por partes
        console.log('Ejecutando consultas por partes...')
        const statements = sql.split(';').filter(stmt => stmt.trim())
        
        for (const statement of statements) {
          if (statement.trim()) {
            console.log(`Ejecutando: ${statement.trim().substring(0, 50)}...`)
            // Nota: Este método no funcionará para todas las consultas, pero es un intento
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement })
            if (stmtError) {
              console.log(`Error en consulta: ${stmtError.message}`)
            }
          }
        }
        
        console.log('Proceso completado con posibles errores. Verifica manualmente en la consola de Supabase.')
        return
      }
    }
    
    console.log('¡Tablas creadas exitosamente!')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

// Ejecutar la función
createTables()
