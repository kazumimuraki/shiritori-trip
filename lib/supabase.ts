import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

// supabaseUrlが空の時（SSR静的生成時）はダミーURLで初期化。実際のDB呼び出しはclient-sideのみ。
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
)

// ゲーム開始を記録
export async function insertGame(gameId: string, startStation: string) {
  const { error } = await supabase.from("shiritori_games").insert({
    id: gameId,
    start_station: startStation,
    start_time: new Date().toISOString(),
  })
  if (error) console.error("insertGame error:", error)
}

// ターンを記録
export async function insertTurn(params: {
  gameId: string
  turnNumber: number
  stationName: string
  prefecture?: string
  cardDrawn?: string
  cardType?: string
  elapsedSeconds: number
  paceDiffSeconds: number
}) {
  const { error } = await supabase.from("shiritori_turns").insert({
    game_id: params.gameId,
    turn_number: params.turnNumber,
    station_name: params.stationName,
    prefecture: params.prefecture ?? null,
    card_drawn: params.cardDrawn ?? null,
    card_type: params.cardType ?? null,
    elapsed_seconds: Math.floor(params.elapsedSeconds),
    pace_diff_seconds: Math.floor(params.paceDiffSeconds),
  })
  if (error) console.error("insertTurn error:", error)
}

// ゲーム終了を記録
export async function updateGameEnd(gameId: string, isComplete: boolean) {
  const { error } = await supabase.from("shiritori_games").update({
    end_time: new Date().toISOString(),
    is_complete: isComplete,
  }).eq("id", gameId)
  if (error) console.error("updateGameEnd error:", error)
}
