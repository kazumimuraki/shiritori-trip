export interface TurnRecord {
  turnNumber: number
  stationName: string
  cardDrawn?: string
  cardType?: string
  warpDestination?: string  // ワープ先地方
  elapsedSeconds: number
  paceDiffSeconds: number
}

export interface BudgetEntry {
  id: string
  amount: number
  description: string
  category: BudgetCategory
  createdAt: number
}

export type BudgetCategory = '交通費' | '食費' | '宿泊費' | 'ミッション経費' | '雑費'
export const BUDGET_CATEGORIES: BudgetCategory[] = ['交通費', '食費', '宿泊費', 'ミッション経費', '雑費']

export interface GameState {
  gameId: string | null
  startStation: string
  startTime: number
  extensionSeconds: number
  currentTurn: number
  nullifyCards: number
  // 追加フィールド
  turns: TurnRecord[]
  pendingStation: string | null   // 到着確定済みだがカード未処理の駅名
  pendingElapsed: number
  pendingPace: number
  pendingWarpDone: string | null  // ワープ完了した地方名（game画面で処理後nullに）
  budget: BudgetEntry[]
  budgetLimit: number
  candidates: string[]            // 次の駅候補メモ（ターン完了でリセット）
}

const STORAGE_KEY = 'shiritori_game_state'

export function loadGameState(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<GameState>
    return {
      gameId: p.gameId ?? null,
      startStation: p.startStation ?? '',
      startTime: p.startTime ?? Date.now(),
      extensionSeconds: p.extensionSeconds ?? 0,
      currentTurn: p.currentTurn ?? 0,
      nullifyCards: p.nullifyCards ?? 0,
      turns: p.turns ?? [],
      pendingStation: p.pendingStation ?? null,
      pendingElapsed: p.pendingElapsed ?? 0,
      pendingPace: p.pendingPace ?? 0,
      pendingWarpDone: p.pendingWarpDone ?? null,
      budget: p.budget ?? [],
      budgetLimit: p.budgetLimit ?? 100000,
      candidates: p.candidates ?? [],
    }
  } catch {
    return null
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearGameState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function createNewGameState(startStation: string, gameId: string): GameState {
  return {
    gameId, startStation, startTime: Date.now(),
    extensionSeconds: 0, currentTurn: 0, nullifyCards: 0,
    turns: [], pendingStation: null, pendingElapsed: 0, pendingPace: 0,
    pendingWarpDone: null, budget: [], budgetLimit: 100000, candidates: [],
  }
}

export const TOTAL_BASE_SECONDS = 24 * 3600
export const MAX_TURNS = 20

export function getRemainingSeconds(state: GameState): number {
  const elapsed = (Date.now() - state.startTime) / 1000
  return Math.max(0, TOTAL_BASE_SECONDS + state.extensionSeconds - elapsed)
}

export function getElapsedSeconds(state: GameState): number {
  return (Date.now() - state.startTime) / 1000
}

export function getPaceDiffSeconds(state: GameState): number {
  if (state.currentTurn === 0) return 0
  const elapsed = getElapsedSeconds(state)
  const remaining = getRemainingSeconds(state)
  const remainingTurns = MAX_TURNS - state.currentTurn
  if (remainingTurns <= 0) return 0
  return (elapsed / state.currentTurn) - (remaining / remainingTurns)
}

export function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function formatDiff(diff: number): string {
  const abs = Math.abs(Math.round(diff / 60))
  if (diff > 0) return `+${abs}分 遅れ`
  if (diff < 0) return `-${abs}分 早い`
  return '順調'
}

// 次のターンが5の倍数か（入力フォーム表示中にチェック）
export function isNextTurn5x(state: GameState): boolean {
  const next = state.currentTurn + 1
  return next > 0 && next % 5 === 0 && next <= MAX_TURNS
}

export function getBudgetRemaining(state: GameState): number {
  return state.budgetLimit - state.budget.reduce((s, e) => s + e.amount, 0)
}
