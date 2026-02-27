import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = SUPABASE_URL
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// Real-time subscription helper
export function subscribeToLeads(callback) {
  if (!supabase) return () => {}
  const channel = supabase
    .channel('leads-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
