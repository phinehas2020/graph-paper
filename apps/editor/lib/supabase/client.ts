'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let browserClient: SupabaseClient | null = null

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    )
  }

  return { url, anonKey }
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient
  }

  const { url, anonKey } = getSupabaseConfig()

  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  })

  return browserClient
}
