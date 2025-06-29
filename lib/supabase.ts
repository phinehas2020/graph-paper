import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zmwxkeakaellfkxkspoq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptd3hrZWFrYWVsbGZreGtzcG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTIyMzIsImV4cCI6MjA2NjcyODIzMn0.fH8HtcBeOEV92hoPMtxyLxTWIcVNLZAnGbKrnpGjv3s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database
export interface Project {
  id: string
  user_id: string
  title: string
  description?: string
  canvas_data: any
  thumbnail_url?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
} 