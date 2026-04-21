import { createClient } from '@supabase/supabase-js'

let supabase = null
try {
  supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
} catch (e) {
  console.warn('[AdmitPredict] Supabase client unavailable', e.message)
}

export { supabase }
export const db = supabase  // backward compat for existing .from() calls
