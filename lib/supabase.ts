import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface ShiritoriGame {
  id: string
  start_station: string
  start_time: string
  end_time?: string
  total_extension_minutes: number
  is_complete: boolean
}

export interface ShiritoriTurn {
  id: string
  game_id: string
  turn_number: number
  station_name: string
  prefecture?: string
  card_drawn?: string
  card_type?: string
  elapsed_seconds: number
  pace_diff_seconds?: number
  created_at: string
}
