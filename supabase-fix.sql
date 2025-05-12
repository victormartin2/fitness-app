import { createClient } from '@supabase/supabase-js'

// Usar las credenciales proporcionadas
const supabaseUrl = 'https://eyezpgphsqivgdzstuba.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5ZXpwZ3Boc3FpdmdkenN0dWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMjk2MDMsImV4cCI6MjA2MjYwNTYwM30.WT0JrL4Ff063iaj87GmNhIaROkaPT5-YsBPsUkSGSpI'
const supabase = createClient(supabaseUrl, supabaseKey)

// Script SQL para corregir las políticas de seguridad
const sql = `
-- Corregir políticas de seguridad para la tabla weights
DROP POLICY IF EXISTS "Users can insert their own weight entries" ON weights;
CREATE POLICY "Users can insert their own weight entries" 
  ON weights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Corregir políticas de seguridad para la tabla workouts
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
CREATE POLICY "Users can insert their own workouts" 
  ON workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Corregir políticas de seguridad para la tabla exercises
DROP POLICY IF EXISTS "Users can insert exercises to their workouts" ON exercises;
CREATE POLICY "Users can insert exercises to their workouts" 
  ON exercises FOR INSERT 
  WITH CHECK (auth.uid() = (SELECT user_id FROM workouts WHERE id = workout_id));
`

// Ejecutar el script SQL
async function fixSecurityPolicies() {
  try {
    console.log('Intentando ejecutar SQL para corregir políticas de seguridad...')
    
    // Intentar ejecutar como consulta directa
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Ejecutando: ${statement.trim().substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          console.log(`Error en consulta: ${error.message}`)
          console.log('Intentando método alternativo...')
          
          // Si falla, intentar con consulta SQL directa
          try {
            // Nota: Este método es solo para demostración, en un entorno real
            // necesitarías permisos de administrador para ejecutar SQL directo
            console.log('Para ejecutar este SQL, deberás hacerlo desde el panel de Supabase SQL Editor')
            console.log(statement.trim())
          } catch (directError) {
            console.error('Error al ejecutar SQL directo:', directError)
          }
        } else {
          console.log('Consulta ejecutada correctamente')
        }
      }
    }
    
    console.log('Proceso completado. Verifica las políticas en el panel de Supabase.')
  } catch (error) {
    console.error('Error inesperado:', error)
  }
}

// Ejecutar la función
fixSecurityPolicies()
