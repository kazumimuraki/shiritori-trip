-- shiritori_games: ゲーム管理
CREATE TABLE IF NOT EXISTS shiritori_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_station TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  total_extension_minutes INT NOT NULL DEFAULT 0
);

-- shiritori_turns: ターン記録
CREATE TABLE IF NOT EXISTS shiritori_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES shiritori_games(id),
  turn_number INT NOT NULL,
  station_name TEXT NOT NULL,
  card_drawn TEXT,
  card_type TEXT,
  prefecture TEXT,
  elapsed_seconds INT,
  pace_diff_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANTs for PostgREST (anon/authenticated)
GRANT ALL ON shiritori_games TO anon, authenticated;
GRANT ALL ON shiritori_turns TO anon, authenticated;
