'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SplitFlap from '@/components/SplitFlap'
import { REGIONS, spinWarp } from '@/lib/cards'
import { loadGameState, saveGameState } from '@/lib/gameState'

type Phase = 'select' | 'spinning' | 'done'

export default function WarpPage() {
  const router = useRouter()
  const [currentRegion, setCurrentRegion] = useState('関東')
  const [phase, setPhase] = useState<Phase>('select')
  const [destination, setDestination] = useState('')
  const [isFlapping, setIsFlapping] = useState(false)
  const [displayRegion, setDisplayRegion] = useState('----')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function handleSpin() {
    if (phase === 'spinning') return
    setPhase('spinning')
    setIsFlapping(true)
    let count = 0
    const total = 20 + Math.floor(Math.random() * 20)
    const candidates = REGIONS.filter(r => r !== currentRegion)

    intervalRef.current = setInterval(() => {
      setDisplayRegion(candidates[Math.floor(Math.random() * candidates.length)])
      count++
      if (count >= total) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        const final = spinWarp(currentRegion)
        setDisplayRegion(final)
        setDestination(final)
        setIsFlapping(false)
        setPhase('done')
      }
    }, 100)
  }

  function handleBack() {
    // ワープ先をgameStateに保存してゲームページへ
    const s = loadGameState()
    if (s) {
      const newS = { ...s, pendingWarpDone: destination }
      saveGameState(newS)
    }
    router.push('/game')
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-6">
        <h1 className="text-purple-400 text-2xl font-mono font-bold text-center tracking-widest">
          🌀 地方ワープ
        </h1>

        <div>
          <label className="text-zinc-500 font-mono text-xs block mb-2 tracking-widest">今いる地方</label>
          <select
            value={currentRegion}
            onChange={e => setCurrentRegion(e.target.value)}
            disabled={phase !== 'select'}
            className="w-full bg-zinc-950 border-2 border-zinc-700 text-white font-mono py-3 px-4 rounded-lg focus:border-purple-400 focus:outline-none disabled:opacity-50"
          >
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* ルーレット表示 */}
        <div className="bg-zinc-950 border-2 border-purple-600 rounded-xl p-4">
          <div className="text-zinc-600 font-mono text-xs mb-3 tracking-widest text-center">WARP DESTINATION</div>
          {phase === 'select' ? (
            <div className="text-zinc-700 font-mono text-3xl font-bold text-center py-3">？？？？</div>
          ) : (
            <SplitFlap value={displayRegion} isAnimating={isFlapping} duration={2000} />
          )}
        </div>

        <div className="space-y-3">
          {phase !== 'done' && (
            <button
              onClick={handleSpin}
              disabled={phase === 'spinning'}
              className="w-full bg-purple-600 text-white font-mono font-bold text-xl py-5 rounded-lg tracking-widest disabled:opacity-40 hover:bg-purple-500 active:bg-purple-700"
            >
              {phase === 'spinning' ? 'SPINNING ...' : 'SPIN !'}
            </button>
          )}

          {phase === 'done' && (
            <>
              <div className="bg-purple-950 border border-purple-700 rounded-xl p-4 text-center">
                <div className="text-purple-400 font-mono text-xs mb-1">ワープ先</div>
                <div className="text-purple-300 font-mono font-bold text-3xl">{destination}</div>
                <div className="text-zinc-500 font-mono text-xs mt-2">
                  {destination}内の駅からしりとりを継続！
                </div>
              </div>
              <button onClick={handleBack}
                className="w-full py-4 bg-yellow-400 text-black font-mono font-bold text-xl rounded-lg tracking-widest hover:bg-yellow-300">
                了解！ゲームへ戻る →
              </button>
              <button onClick={handleSpin}
                className="w-full py-2 border border-zinc-700 text-zinc-500 font-mono rounded hover:border-purple-500 hover:text-purple-400">
                もう一度回す
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
