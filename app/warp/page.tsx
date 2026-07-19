'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SplitFlap from '@/components/SplitFlap'
import { REGIONS, spinWarp } from '@/lib/cards'

type Phase = 'select' | 'animating' | 'done'

export default function WarpPage() {
  const router = useRouter()
  const [currentRegion, setCurrentRegion] = useState('関東')
  const [phase, setPhase] = useState<Phase>('select')
  const [destination, setDestination] = useState('')

  function handleSpin() {
    const dest = spinWarp(currentRegion)
    setDestination(dest)
    setPhase('animating')
  }

  function handleAnimDone() {
    setPhase('done')
  }

  function handleBack() {
    router.push('/game')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="max-w-sm w-full">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-xs tracking-[0.4em] text-purple-400 mb-1">WARP CARD</div>
          <h1 className="text-2xl font-bold tracking-widest text-white">
            地方ワープ
          </h1>
          <p className="text-xs text-zinc-500 mt-2">どこかの地方に飛ばされます！</p>
        </div>

        {/* 現在地方選択 */}
        {phase === 'select' && (
          <div className="mb-6">
            <div className="text-xs text-zinc-500 tracking-widest mb-2">今いる地方</div>
            <select
              value={currentRegion}
              onChange={e => setCurrentRegion(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white font-bold focus:outline-none focus:border-purple-500"
            >
              {REGIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {/* パタパタ表示 */}
        {(phase === 'animating' || phase === 'done') && (
          <div className="mb-8">
            <div className="text-xs text-zinc-500 tracking-widest mb-2 text-center">ワープ先</div>
            <SplitFlap
              value={destination}
              isAnimating={phase === 'animating'}
              onDone={handleAnimDone}
              duration={2500}
            />
          </div>
        )}

        {/* ルーレット部（選択中は大きく表示） */}
        {phase === 'select' && (
          <div className="mb-8 p-6 bg-zinc-900 border border-purple-900 rounded-lg text-center">
            <div className="text-6xl mb-3">
              {REGIONS.map((r, i) => (
                <span key={r} className={`inline-block mx-1 text-sm ${r === currentRegion ? 'text-purple-400' : 'text-zinc-700'}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        {phase === 'select' && (
          <button
            onClick={handleSpin}
            className="w-full py-5 bg-purple-600 text-white rounded-lg font-bold tracking-widest text-base hover:bg-purple-500 transition-colors"
          >
            SPIN
          </button>
        )}

        {phase === 'animating' && (
          <div className="w-full py-5 bg-zinc-800 text-zinc-500 rounded-lg text-center font-bold tracking-widest text-base">
            SPINNING...
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4">
            <div className="text-center py-4 bg-purple-900 border border-purple-500 rounded-lg">
              <div className="text-purple-300 text-sm mb-1">ワープ先確定！</div>
              <div className="text-white font-bold text-2xl tracking-widest">{destination}</div>
              <div className="text-zinc-400 text-xs mt-2">その地方の駅に移動してください</div>
            </div>
            <button
              onClick={handleBack}
              className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold tracking-widest hover:bg-yellow-300 transition-colors"
            >
              確認してゲームに戻る
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
