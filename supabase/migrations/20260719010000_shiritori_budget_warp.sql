-- 支出記録テーブル
CREATE TABLE IF NOT EXISTS shiritori_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  amount INT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ワープ先カラムをturnsテーブルに追加
ALTER TABLE shiritori_turns ADD COLUMN IF NOT EXISTS warp_destination TEXT;

GRANT ALL ON shiritori_budget TO anon, authenticated;
