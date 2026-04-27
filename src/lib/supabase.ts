import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'guest' | 'staff' | 'admin'
          building_id: string
          created_at: string
        }
      }
      incidents: {
        Row: {
          id: string
          building_id: string
          type: 'fire' | 'medical' | 'security' | 'structural' | 'evacuation'
          severity: 'low' | 'medium' | 'high' | 'critical'
          location: string
          floor: number
          description: string
          status: 'active' | 'responding' | 'on-scene' | 'contained' | 'closed'
          reported_by: string
          assigned_responders: string[]
          created_at: string
          updated_at: string
        }
      }
      responders: {
        Row: {
          id: string
          building_id: string
          name: string
          type: 'fire' | 'medical' | 'security' | 'command'
          status: 'available' | 'responding' | 'on-scene' | 'unavailable'
          location: string
          created_at: string
        }
      }
    }
  }
}
