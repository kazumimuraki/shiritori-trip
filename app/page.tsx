'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadGameState, clearGameState } from '@/lib/gameState'

export default function HomePage() {
  const router = useRouter()
  const [existingGame, setExistingGame] = useState(false)

  useEffect(() => {
    const state = loadGameState()
    if (state && state.gameId) {
      setExistingGame(true)
    }
  }, [])

  function handleNew() {
    clearGameState()
    router.push('/roulette')
  }

  function handleContinue() {
    router.push('/game')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <div className="max-w-sm w-full text-center">
        {/* CRRAロゴ */}
        <div className="flex justify-center mb-8">
          <img src="/crra-logo.png" alt="CRRA" style={{ height: '72px' }} />
        </div>
        {/* タイトル */}
        <div className="mb-2">
          <div className="text-xs tracking-[0.4em] text-zinc-500 mb-1">STATION NAME</div>
          <h1 className="text-4xl font-bold tracking-widest text-yellow-400 mb-1">
            SHIRITORI
          </h1>
          <h2 className="text-2xl font-bold tracking-widest text-white">
            TRIP
          </h2>
        </div>

        <div className="border-t border-zinc-800 my-6" />

        {/* ルール概要 */}
        <div className="text-left text-xs text-zinc-400 mb-8 space-y-2 bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="text-yellow-400 font-bold text-sm mb-2">RULE</div>
          <div>• 24時間・20ターンの駅名しりとり旅</div>
          <div>• 各駅でミッションカードを引く</div>
          <div>• ラッキーカードで時間延長</div>
          <div>• 5の倍数ターンは県またぎ移動必須</div>
          <div>• ワープカードは地方移動が発生</div>
        </div>

        {existingGame && (
          <button
            onClick={handleContinue}
            className="w-full mb-3 py-4 bg-zinc-900 border border-yellow-400 text-yellow-400 rounded-lg font-bold tracking-widest text-sm hover:bg-yellow-400 hover:text-black transition-colors"
          >
            CONTINUE
          </button>
        )}

        <button
          onClick={handleNew}
          className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold tracking-widest text-sm hover:bg-yellow-300 transition-colors"
        >
          NEW GAME
        </button>

      </div>
    </main>
  )
}
