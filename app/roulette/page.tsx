'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SplitFlap from '@/components/SplitFlap'
import { ALL_STATIONS, getRandomStation } from '@/lib/stations'
import { createNewGameState, saveGameState } from '@/lib/gameState'
import { supabase } from '@/lib/supabase'

type Phase = 'idle' | 'animating' | 'done'

export default function RoulettePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [station, setStation] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  function handleSpin() {
    const picked = getRandomStation()
    setStation(picked)
    setPhase('animating')
  }

  function handleAnimDone() {
    setPhase('done')
  }

  async function handleStart() {
    setIsStarting(true)
    setError('')

    try {
      // Supabaseにゲーム作成
      const { data, error: dbError } = await supabase
        .from('shiritori_games')
        .insert({ start_station: station })
        .select()
        .single()

      let gameId = ''
      if (dbError || !data) {
        // Supabase失敗時はlocalStorageのみで動作
        console.error('Supabase error:', dbError)
        gameId = crypto.randomUUID()
      } else {
        gameId = data.id
      }

      // localStorageに保存
      const state = createNewGameState(station, gameId)
      saveGameState(state)

      router.push('/game')
    } catch (err) {
      console.error(err)
      const gameId = crypto.randomUUID()
      const state = createNewGameState(station, gameId)
      saveGameState(state)
      router.push('/game')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="max-w-sm w-full">
        {/* タイトル */}
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.4em] text-zinc-500 mb-1">DEPARTURE</div>
          <h1 className="text-2xl font-bold tracking-widest text-yellow-400">
            出発駅ルーレット
          </h1>
        </div>

        {/* パタパタ表示 */}
        <div className="mb-8">
          {phase === 'idle' && (
            <div className="flex justify-center p-8 border border-zinc-800 rounded-lg bg-zinc-900">
              <span className="text-zinc-600 text-lg tracking-widest">--- ---</span>
            </div>
          )}
          {(phase === 'animating' || phase === 'done') && (
            <SplitFlap
              value={station}
              isAnimating={phase === 'animating'}
              onDone={handleAnimDone}
              duration={2800}
            />
          )}
        </div>

        {/* ボタンエリア */}
        {phase !== 'done' && (
          <button
            onClick={handleSpin}
            disabled={phase === 'animating'}
            className="w-full py-5 bg-yellow-400 text-black rounded-lg font-bold tracking-widest text-base hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {phase === 'animating' ? 'SPINNING...' : 'SPIN'}
          </button>
        )}

        {phase === 'done' && (
          <div className="space-y-3">
            <div className="text-center text-zinc-400 text-sm py-2">
              <span className="text-white font-bold text-lg">「{station}」</span> に到着しますか？
            </div>
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full py-5 bg-yellow-400 text-black rounded-lg font-bold tracking-widest text-base hover:bg-yellow-300 transition-colors disabled:opacity-50"
            >
              {isStarting ? 'STARTING...' : 'この駅からスタート！'}
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="w-full py-3 bg-transparent border border-zinc-700 text-zinc-400 rounded-lg font-bold tracking-widest text-sm hover:border-zinc-500 transition-colors"
            >
              もう一度回す
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 text-red-400 text-sm text-center">{error}</div>
        )}
      </div>
    </main>
  )
}
