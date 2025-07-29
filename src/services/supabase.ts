import { createClient } from '@supabase/supabase-js'

// Replace with your Supabase project URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface TimeLog {
  id: string
  user_id: string
  start_time: string
  end_time: string
  title?: string
  project?: string
  description?: string
  created_at?: string
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface WorkSessionData {
  title: string
  project: string
  description: string
}

// Notes types
export interface Folder {
  id: string
  user_id: string
  name: string
  color: string
  parent_id?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  folder_id?: string
  title: string
  content: string
  is_favorite: boolean
  is_archived: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  folder_id?: string
  title: string
  description?: string
  is_completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  created_at: string
  updated_at: string
} 