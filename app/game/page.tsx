'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import GameHeader from '@/components/GameHeader'
import SplitFlap from '@/components/SplitFlap'
import {
  loadGameState,
  saveGameState,
  GameState,
  getRemainingSeconds,
  getElapsedSeconds,
  getPaceDiffSeconds,
  MAX_TURNS,
} from '@/lib/gameState'
import { drawCard, Card, getCardColor, getCardBg } from '@/lib/cards'
import { supabase } from '@/lib/supabase'

type CardPhase = 'idle' | 'drawn'

export default function GamePage() {
  const router = useRouter()
  const [state, setState] = useState<GameState | null>(null)
  const [stationInput, setStationInput] = useState('')
  const [confirmedStation, setConfirmedStation] = useState('')
  const [stationFlap, setStationFlap] = useState(false)
  const [cardPhase, setCardPhase] = useState<CardPhase>('idle')
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [showNullifyMenu, setShowNullifyMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const s = loadGameState()
    if (!s || !s.gameId) {
      router.push('/')
      return
    }
    setState(s)
    // 現在ターンの駅名を初期表示
    if (s.currentTurn === 0) {
      setConfirmedStation(s.startStation)
    }
  }, [router])

  if (!state) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-zinc-600 tracking-widest">LOADING...</span>
      </div>
    )
  }

  const isFiveTurn = state.currentTurn > 0 && state.currentTurn % 5 === 0
  const isComplete = state.currentTurn >= MAX_TURNS || getRemainingSeconds(state) <= 0

  async function handleArrival() {
    if (!stationInput.trim()) return
    const newTurn = state!.currentTurn + 1
    const elapsed = Math.round(getElapsedSeconds(state!))
    const paceDiff = Math.round(getPaceDiffSeconds(state!))

    const newState: GameState = {
      ...state!,
      currentTurn: newTurn,
    }
    saveGameState(newState)
    setState(newState)
    setConfirmedStation(stationInput.trim())
    setStationFlap(true)
    setStationInput('')
    setCardPhase('idle')
    setCurrentCard(null)
    setStatusMsg('')
    setTimeout(() => setStationFlap(false), 3000)

    // Supabase保存（失敗してもゲーム継続）
    try {
      await supabase.from('shiritori_turns').insert({
        game_id: state!.gameId,
        turn_number: newTurn,
        station_name: stationInput.trim(),
        elapsed_seconds: elapsed,
        pace_diff_seconds: paceDiff,
      })
    } catch (e) {
      console.error('Turn save error:', e)
    }

    inputRef.current?.focus()
  }

  function handleDrawCard() {
    const card = drawCard()
    setCurrentCard(card)
    setCardPhase('drawn')
  }

  function handleLucky() {
    const newState: GameState = {
      ...state!,
      extensionSeconds: state!.extensionSeconds + 3600,
    }
    saveGameState(newState)
    setState(newState)
    setStatusMsg('ラッキー！ 1時間延長されました！')
    setCardPhase('idle')
    setCurrentCard(null)
    // Supabase更新
    supabase.from('shiritori_games').update({
      total_extension_minutes: Math.round(newState.extensionSeconds / 60)
    }).eq('id', newState.gameId).then()
  }

  function handleNullifyAdd() {
    const newState: GameState = {
      ...state!,
      nullifyCards: state!.nullifyCards + 1,
    }
    saveGameState(newState)
    setState(newState)
    setStatusMsg('無力化カードを手持ちに追加しました')
    setCardPhase('idle')
    setCurrentCard(null)
  }

  function handleWarp() {
    // カード情報をsessionStorageに保存してwarpページへ
    sessionStorage.setItem('warp_triggered', '1')
    router.push('/warp')
  }

  function handleUseNullify(cost: number) {
    if (state!.nullifyCards < cost) {
      setStatusMsg(`無力化カードが${cost}枚必要です（手持ち: ${state!.nullifyCards}枚）`)
      return
    }
    const newState: GameState = {
      ...state!,
      nullifyCards: state!.nullifyCards - cost,
    }
    saveGameState(newState)
    setState(newState)
    setStatusMsg(`無力化カード${cost}枚を使用しました`)
    setShowNullifyMenu(false)
    setCardPhase('idle')
    setCurrentCard(null)
  }

  function handleFinish() {
    supabase.from('shiritori_games').update({
      end_time: new Date().toISOString(),
      is_complete: true,
    }).eq('id', state!.gameId).then()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <GameHeader state={state} />

      <main className="flex-1 flex flex-col items-center px-4 py-4 max-w-sm mx-auto w-full">

        {/* ゲーム完了 */}
        {isComplete && (
          <div className="w-full text-center py-8">
            <div className="text-yellow-400 text-2xl font-bold tracking-widest mb-4">GOAL!</div>
            <div className="text-zinc-400 mb-6">20ターン完走おめでとうございます！</div>
            <button onClick={handleFinish} className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold tracking-widest">
              ホームへ戻る
            </button>
          </div>
        )}

        {!isComplete && (
          <>
            {/* 5の倍数ターンバナー */}
            {isFiveTurn && (
              <div className="w-full mb-4 py-3 bg-red-900 border border-red-500 rounded-lg text-center">
                <span className="text-red-300 font-bold text-sm tracking-wide">
                  県またぎ移動必須！
                </span>
              </div>
            )}

            {/* 現在駅パタパタ表示 */}
            {confirmedStation && (
              <div className="w-full mb-4">
                <div className="text-xs text-zinc-500 tracking-widest mb-1 text-center">
                  {state.currentTurn === 0 ? '出発駅' : `第${state.currentTurn}ターン`}
                </div>
                <SplitFlap
                  value={confirmedStation}
                  isAnimating={stationFlap}
                  duration={2500}
                />
              </div>
            )}

            {/* 駅名入力 */}
            <div className="w-full mb-4 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 tracking-widest mb-2">NEXT STATION</div>
              <input
                ref={inputRef}
                type="text"
                value={stationInput}
                onChange={e => setStationInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleArrival()}
                placeholder="今いる駅名を入力"
                className="w-full bg-black border border-zinc-700 rounded px-3 py-3 text-white text-lg font-bold placeholder-zinc-700 focus:outline-none focus:border-yellow-400"
              />
              <button
                onClick={handleArrival}
                disabled={!stationInput.trim()}
                className="w-full mt-3 py-3 bg-yellow-400 text-black rounded font-bold tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 transition-colors"
              >
                到着確定
              </button>
            </div>

            {/* ミッションカードエリア */}
            <div className="w-full mb-4 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 tracking-widest mb-3">MISSION CARD</div>

              {cardPhase === 'idle' && (
                <button
                  onClick={handleDrawCard}
                  className="w-full py-4 border border-zinc-700 rounded-lg text-zinc-300 font-bold tracking-widest hover:border-yellow-400 hover:text-yellow-400 transition-colors"
                >
                  カードを引く
                </button>
              )}

              {cardPhase === 'drawn' && currentCard && (
                <div className={`rounded-lg border p-4 ${getCardBg(currentCard.type)} ${getCardColor(currentCard.type)}`}>
                  <div className="text-xs tracking-widest mb-1 opacity-70">
                    {currentCard.type === 'normal' && 'MISSION'}
                    {currentCard.type === 'lucky' && 'LUCKY'}
                    {currentCard.type === 'warp' && 'WARP'}
                    {currentCard.type === 'nullify' && 'NULLIFY'}
                  </div>
                  <div className="font-bold text-lg mb-2">{currentCard.title}</div>
                  <div className="text-sm opacity-80 mb-4">{currentCard.description}</div>

                  {currentCard.type === 'lucky' && (
                    <button
                      onClick={handleLucky}
                      className="w-full py-3 bg-yellow-400 text-black rounded font-bold tracking-widest hover:bg-yellow-300"
                    >
                      +1時間ゲット！
                    </button>
                  )}
                  {currentCard.type === 'nullify' && (
                    <button
                      onClick={handleNullifyAdd}
                      className="w-full py-3 bg-blue-600 text-white rounded font-bold tracking-widest hover:bg-blue-500"
                    >
                      手持ちに追加
                    </button>
                  )}
                  {currentCard.type === 'warp' && (
                    <button
                      onClick={handleWarp}
                      className="w-full py-3 bg-purple-600 text-white rounded font-bold tracking-widest hover:bg-purple-500"
                    >
                      地方ワープルーレットへ
                    </button>
                  )}
                  {currentCard.type === 'normal' && (
                    <button
                      onClick={() => { setCardPhase('idle'); setCurrentCard(null) }}
                      className="w-full py-2 border border-zinc-600 text-zinc-400 rounded text-sm hover:border-zinc-400"
                    >
                      確認した
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 無力化カード使用 */}
            {state.nullifyCards > 0 && (
              <div className="w-full mb-4 bg-zinc-900 rounded-lg border border-zinc-800 p-4">
                <div className="text-xs text-zinc-500 tracking-widest mb-2">
                  NULLIFY CARD（手持ち: {state.nullifyCards}枚）
                </div>
                {!showNullifyMenu ? (
                  <button
                    onClick={() => setShowNullifyMenu(true)}
                    className="w-full py-3 border border-blue-700 text-blue-400 rounded-lg font-bold text-sm hover:border-blue-500 transition-colors"
                  >
                    無力化カードを使う
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUseNullify(1)}
                      disabled={state.nullifyCards < 1}
                      className="w-full py-3 bg-blue-900 border border-blue-600 text-blue-300 rounded-lg font-bold text-sm disabled:opacity-40"
                    >
                      1枚使う（ミッション無力化）
                    </button>
                    <button
                      onClick={() => handleUseNullify(2)}
                      disabled={state.nullifyCards < 2}
                      className="w-full py-3 bg-blue-900 border border-blue-600 text-blue-300 rounded-lg font-bold text-sm disabled:opacity-40"
                    >
                      2枚使う（ワープ / 5の倍数ルール無力化）
                    </button>
                    <button
                      onClick={() => setShowNullifyMenu(false)}
                      className="w-full py-2 text-zinc-600 text-xs"
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ステータスメッセージ */}
            {statusMsg && (
              <div className="w-full mb-4 py-3 bg-zinc-800 rounded-lg text-center text-sm text-zinc-300">
                {statusMsg}
              </div>
            )}

            {/* ターン進捗バー */}
            <div className="w-full">
              <div className="flex justify-between text-xs text-zinc-600 mb-1">
                <span>TURN {state.currentTurn}</span>
                <span>/ {MAX_TURNS}</span>
              </div>
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${(state.currentTurn / MAX_TURNS) * 100}%` }}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
