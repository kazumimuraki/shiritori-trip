'use client'

import { useEffect, useState } from 'react'
import { GameState, formatSeconds, formatDiff, getPaceDiffSeconds, getRemainingSeconds } from '@/lib/gameState'

export default function GameHeader({ state }: { state: GameState }) {
  const [remaining, setRemaining] = useState(getRemainingSeconds(state))
  const [diff, setDiff] = useState(getPaceDiffSeconds(state))

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getRemainingSeconds(state))
      setDiff(getPaceDiffSeconds(state))
    }, 1000)
    return () => clearInterval(interval)
  }, [state])

  const diffStr = formatDiff(diff)
  const diffColor = diff > 300 ? 'text-red-400' : diff < -300 ? 'text-green-400' : 'text-yellow-400'

  return (
    <header className="w-full bg-zinc-900 border-b border-zinc-700 px-3 py-2 sticky top-0 z-50">
      <div className="max-w-sm mx-auto">
        <div className="text-center text-yellow-400 font-bold tracking-widest text-sm mb-1">
          SHIRITORI TRIP
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-white font-mono">
            残り <span className="text-yellow-400 text-sm font-bold">{formatSeconds(remaining)}</span>
          </span>
          <span className="text-zinc-400">
            第<span className="text-white font-bold">{state.currentTurn}</span>ターン
          </span>
          <span className={`font-bold ${diffColor}`}>{diffStr}</span>
        </div>
        {state.nullifyCards > 0 && (
          <div className="text-center text-xs text-blue-400 mt-0.5">
            手持ち無力化カード: {state.nullifyCards}枚
          </div>
        )}
      </div>
    </header>
  )
}
