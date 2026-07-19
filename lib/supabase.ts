import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function insertGame(gameId: string, startStation: string) {
  const { error } = await supabase.from('shiritori_games').insert({
    id: gameId, start_station: startStation, start_time: new Date().toISOString(),
  })
  if (error) console.error('insertGame error:', error)
}

export async function insertTurn(params: {
  gameId: string; turnNumber: number; stationName: string; prefecture?: string
  cardDrawn?: string; cardType?: string; elapsedSeconds: number; paceDiffSeconds: number
}) {
  const { error } = await supabase.from('shiritori_turns').insert({
    game_id: params.gameId, turn_number: params.turnNumber, station_name: params.stationName,
    prefecture: params.prefecture ?? null, card_drawn: params.cardDrawn ?? null,
    card_type: params.cardType ?? null,
    elapsed_seconds: Math.floor(params.elapsedSeconds),
    pace_diff_seconds: Math.floor(params.paceDiffSeconds),
  })
  if (error) console.error('insertTurn error:', error)
}

export async function updateGameEnd(gameId: string, isComplete: boolean) {
  const { error } = await supabase.from('shiritori_games').update({
    end_time: new Date().toISOString(), is_complete: isComplete,
  }).eq('id', gameId)
  if (error) console.error('updateGameEnd error:', error)
}
