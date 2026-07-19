export interface GameState {
  gameId: string | null
  startStation: string
  startTime: number // Unix timestamp ms
  extensionSeconds: number // ラッキーカードで追加した秒数
  currentTurn: number // 0=出発駅
  nullifyCards: number // 手持ち無力化カード枚数
}

const STORAGE_KEY = 'shiritori_game_state'

export function loadGameState(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as GameState
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
    gameId,
    startStation,
    startTime: Date.now(),
    extensionSeconds: 0,
    currentTurn: 0,
    nullifyCards: 0,
  }
}

export const TOTAL_BASE_SECONDS = 24 * 3600 // 24時間
export const MAX_TURNS = 20

export function getRemainingSeconds(state: GameState): number {
  const total = TOTAL_BASE_SECONDS + state.extensionSeconds
  const elapsed = (Date.now() - state.startTime) / 1000
  return Math.max(0, total - elapsed)
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
  const idealSecondsPerTurn = remaining / remainingTurns
  const actualSecondsPerTurn = elapsed / state.currentTurn
  return actualSecondsPerTurn - idealSecondsPerTurn
}

export function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDiff(diff: number): string {
  const abs = Math.abs(Math.round(diff / 60))
  if (diff > 0) return `+${abs}分 遅れ`
  if (diff < 0) return `-${abs}分 早い`
  return '順調'
}
