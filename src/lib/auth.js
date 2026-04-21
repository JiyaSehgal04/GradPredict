import { supabase } from './supabase'

async function hashPassword(email, password) {
  const raw = new TextEncoder().encode(email.toLowerCase() + ':' + password)
  const buf = await crypto.subtle.digest('SHA-256', raw)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function registerUser(name, email, password) {
  const password_hash = await hashPassword(email, password)

  // Check if email already taken
  const { data: existing } = await supabase
    .from('users')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (existing) throw new Error('An account with this email already exists. Try signing in.')

  const { data, error } = await supabase
    .from('users')
    .insert({ name, email: email.toLowerCase(), password_hash })
    .select('id, name, email')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function loginUser(email, password) {
  const password_hash = await hashPassword(email, password)

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('email', email.toLowerCase())
    .eq('password_hash', password_hash)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Incorrect email or password.')
  return data
}
