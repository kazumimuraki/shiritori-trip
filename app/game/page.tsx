'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import SplitFlap from '@/components/SplitFlap'
import {
  loadGameState, saveGameState, clearGameState,
  GameState, TurnRecord, BudgetEntry, BudgetCategory, BUDGET_CATEGORIES,
  getRemainingSeconds, getElapsedSeconds, getPaceDiffSeconds,
  formatSeconds, isNextTurn5x, getBudgetRemaining,
  MAX_TURNS,
} from '@/lib/gameState'
import { drawCard, Card, getCardColor, getCardBg } from '@/lib/cards'
import { supabase } from '@/lib/supabase'

type GamePhase = 'input' | 'card_pending' | 'card_drawn'

function formatYen(n: number): string {
  return `¥${Math.max(0, n).toLocaleString()}`
}

export default function GamePage() {
  const router = useRouter()
  const [gs, setGs] = useState<GameState | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('input')
  const [selectedStation, setSelectedStation] = useState('')   // 候補から選択した駅名
  const [isFlappingNext, setIsFlappingNext] = useState(false)  // NEXT STATIONのパタパタ
  const [displayStation, setDisplayStation] = useState('')
  const [isFlapping, setIsFlapping] = useState(false)
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [showCandidates, setShowCandidates] = useState(true)
  const [candidateInput, setCandidateInput] = useState('')
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showBudgetDetail, setShowBudgetDetail] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ amount: '', description: '', category: '交通費' as BudgetCategory })
  const [budgetToast, setBudgetToast] = useState('')
  const [showNullifyMenu, setShowNullifyMenu] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const s = loadGameState()
    if (!s?.gameId) { router.push('/'); return }
    setGs(s)
    setRemaining(getRemainingSeconds(s))
    if (s.pendingStation) {
      setDisplayStation(s.pendingStation)
      if (s.pendingWarpDone) finishTurnAfterWarp(s)
      else setPhase('card_pending')
    }
  }, [])

  async function finishTurnAfterWarp(s: GameState) {
    if (!s.pendingStation || !s.pendingWarpDone) return
    const record: TurnRecord = {
      turnNumber: s.currentTurn, stationName: s.pendingStation,
      cardDrawn: '地方ワープカード', cardType: 'warp',
      warpDestination: s.pendingWarpDone,
      elapsedSeconds: s.pendingElapsed, paceDiffSeconds: s.pendingPace,
    }
    const newGs: GameState = { ...s, turns: [...s.turns, record], pendingStation: null, pendingElapsed: 0, pendingPace: 0, pendingWarpDone: null }
    saveGameState(newGs); setGs(newGs); setPhase('input')
    try {
      await supabase.from('shiritori_turns').insert({
        game_id: s.gameId, turn_number: record.turnNumber, station_name: record.stationName,
        card_drawn: record.cardDrawn, card_type: record.cardType,
        warp_destination: record.warpDestination,
        elapsed_seconds: record.elapsedSeconds, pace_diff_seconds: record.paceDiffSeconds,
      })
    } catch {}
  }

  useEffect(() => {
    if (!gs?.startTime) return
    timerRef.current = setInterval(() => {
      const s = loadGameState()
      if (s) setRemaining(getRemainingSeconds(s))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gs?.startTime])

  if (!gs) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="text-zinc-600 tracking-widest">LOADING...</span>
    </div>
  )

  const budgetRemaining = getBudgetRemaining(gs)
  const isComplete = gs.currentTurn >= MAX_TURNS || remaining <= 0
  const next5x = isNextTurn5x(gs)
  const currentDisplayStation = gs.pendingStation
    ?? (gs.turns.length > 0 ? gs.turns[gs.turns.length - 1].stationName : gs.startStation)

  // ===== 候補タップで選択 =====
  function handleSelectCandidate(station: string) {
    setSelectedStation(station)
    setIsFlappingNext(true)
    setTimeout(() => setIsFlappingNext(false), 1500)
  }

  // ===== 到着確定 =====
  async function handleArrival() {
    if (!gs || !selectedStation.trim()) return
    const name = selectedStation.trim()
    const elapsed = Math.round(getElapsedSeconds(gs))
    const pace = Math.round(getPaceDiffSeconds(gs))
    const newGs: GameState = {
      ...gs,
      currentTurn: gs.currentTurn + 1,
      pendingStation: name,
      pendingElapsed: elapsed,
      pendingPace: pace,
      candidates: [],
    }
    saveGameState(newGs); setGs(newGs)
    setSelectedStation('')
    setDisplayStation(name)
    setIsFlapping(true)
    setTimeout(() => setIsFlapping(false), 2500)
    setPhase('card_pending')
    setCurrentCard(null)
    setStatusMsg('')
  }

  // ===== カードを引く =====
  function handleDrawCard() {
    setCurrentCard(drawCard()); setPhase('card_drawn')
  }

  // ===== カード処理完了 =====
  async function handleCardDone(card: Card | null, opts: {
    luckyExtend?: boolean; nullifyAdd?: boolean; nullifyCost?: number
    skipCard?: boolean; goWarp?: boolean
  } = {}) {
    if (!gs || !gs.pendingStation) return
    let newGs = { ...gs }
    if (opts.luckyExtend) newGs.extensionSeconds += 3600
    if (opts.nullifyAdd)  newGs.nullifyCards += 1
    if (opts.nullifyCost) newGs.nullifyCards -= opts.nullifyCost

    if (!opts.goWarp) {
      const record: TurnRecord = {
        turnNumber: newGs.currentTurn, stationName: newGs.pendingStation!,
        cardDrawn: card?.title, cardType: card?.type,
        elapsedSeconds: newGs.pendingElapsed, paceDiffSeconds: newGs.pendingPace,
      }
      newGs.turns = [...newGs.turns, record]
      newGs.pendingStation = null; newGs.pendingElapsed = 0; newGs.pendingPace = 0
      saveGameState(newGs); setGs(newGs)
      try {
        await supabase.from('shiritori_turns').insert({
          game_id: gs.gameId, turn_number: record.turnNumber, station_name: record.stationName,
          card_drawn: record.cardDrawn ?? null, card_type: record.cardType ?? null,
          elapsed_seconds: record.elapsedSeconds, pace_diff_seconds: record.paceDiffSeconds,
        })
      } catch {}
      if (opts.luckyExtend) supabase.from('shiritori_games').update({ total_extension_minutes: Math.round(newGs.extensionSeconds / 60) }).eq('id', newGs.gameId).then()
      if (newGs.currentTurn >= MAX_TURNS) supabase.from('shiritori_games').update({ end_time: new Date().toISOString(), is_complete: true }).eq('id', newGs.gameId).then()
      setCurrentCard(null); setPhase('input')
      setStatusMsg(opts.luckyExtend ? '🍀 1時間延長！' : opts.nullifyAdd ? '🛡 無力化カードを追加！' : '')
    } else {
      saveGameState(newGs); setGs(newGs); router.push('/warp')
    }
  }

  // ===== 候補追加 =====
  function handleAddCandidate() {
    if (!gs || !candidateInput.trim()) return
    const name = candidateInput.trim()
    if (gs.candidates.includes(name)) { setCandidateInput(''); return }
    const newGs = { ...gs, candidates: [...gs.candidates, name] }
    saveGameState(newGs); setGs(newGs); setCandidateInput('')
  }

  // ===== 候補削除 =====
  function handleRemoveCandidate(name: string) {
    if (!gs) return
    const newGs = { ...gs, candidates: gs.candidates.filter(c => c !== name) }
    saveGameState(newGs); setGs(newGs)
    if (selectedStation === name) setSelectedStation('')
  }

  // ===== 無力化カード使用 =====
  function handleUseNullify(cost: number) {
    if (!gs) return
    if (gs.nullifyCards < cost) { setStatusMsg(`無力化カードが${cost}枚必要です`); return }
    const newGs = { ...gs, nullifyCards: gs.nullifyCards - cost }
    saveGameState(newGs); setGs(newGs); setShowNullifyMenu(false)
    setStatusMsg(`🛡 ${cost}枚使用しました`)
    if (phase === 'card_drawn') { setCurrentCard(null); setPhase('input') }
  }

  // ===== 支出追加 =====
  async function handleAddBudget() {
    if (!gs) return
    const amount = parseInt(budgetForm.amount)
    if (!amount || amount <= 0 || !budgetForm.description.trim()) return
    const entry: BudgetEntry = {
      id: Date.now().toString(), amount,
      description: budgetForm.description.trim(),
      category: budgetForm.category, createdAt: Date.now(),
    }
    const newGs = { ...gs, budget: [...gs.budget, entry] }
    saveGameState(newGs); setGs(newGs)
    setBudgetForm({ amount: '', description: '', category: '交通費' })
    setShowBudgetModal(false)
    // トースト通知
    setBudgetToast(`記録しました ¥${amount.toLocaleString()}`)
    setTimeout(() => setBudgetToast(''), 2500)
    try {
      await supabase.from('shiritori_budget').insert({
        game_id: gs.gameId, amount: entry.amount,
        description: entry.description, category: entry.category,
        created_at: new Date(entry.createdAt).toISOString(),
      })
    } catch {}
  }

  // ===== ゲーム完了 =====
  if (isComplete) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full space-y-6 text-center">
          {gs.currentTurn >= MAX_TURNS
            ? <div className="text-yellow-400 font-mono text-3xl font-bold">GOAL!</div>
            : <div className="text-red-400 font-mono text-3xl font-bold">TIME UP</div>
          }
          <div className="bg-zinc-900 rounded-lg p-4 text-left space-y-2">
            <div className="text-zinc-400 font-mono text-xs">旅の記録</div>
            <div className="text-white font-mono text-sm">第{gs.currentTurn}ターン / {MAX_TURNS}</div>
            <div className="text-white font-mono text-sm">使用予算: ¥{(gs.budgetLimit - budgetRemaining).toLocaleString()}</div>
          </div>
          <button onClick={() => { clearGameState(); router.push('/') }}
            className="w-full py-4 bg-yellow-400 text-black rounded-lg font-bold font-mono tracking-widest">
            ホームへ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* ===== ヘッダー ===== */}
      <header className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-sm mx-auto px-3 py-2">
          <div className="text-center text-yellow-400 font-mono font-bold text-xs tracking-widest mb-1">
            SHIRITORI TRIP
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-yellow-400 font-bold">{formatSeconds(remaining)}</span>
            <span className="text-zinc-400">第<span className="text-white font-bold">{gs.currentTurn}</span>/{MAX_TURNS}ターン</span>
            <span
              className={`font-bold cursor-pointer underline decoration-dotted ${budgetRemaining < 10000 ? 'text-red-400' : 'text-green-400'}`}
              onClick={() => setShowBudgetDetail(true)}
            >
              {formatYen(budgetRemaining)}
            </span>
            {gs.nullifyCards > 0 && <span className="text-blue-400">🛡{gs.nullifyCards}</span>}
          </div>
        </div>
      </header>

      {/* ===== 旅程：横スクロール連鎖表示 ===== */}
      {gs.turns.length > 0 && (
        <div className="bg-zinc-950 border-b border-zinc-800 px-3 py-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 whitespace-nowrap text-xs font-mono">
            <span className="text-zinc-600">{gs.startStation}</span>
            {gs.turns.map(t => (
              <span key={t.turnNumber} className="flex items-center gap-1">
                <span className="text-zinc-700">→</span>
                <span className={
                  t.cardType === 'lucky' ? 'text-yellow-400' :
                  t.cardType === 'warp'  ? 'text-purple-400' :
                  t.cardType === 'nullify' ? 'text-blue-400' :
                  'text-zinc-400'
                }>{t.stationName}</span>
              </span>
            ))}
            {gs.pendingStation && (
              <span className="flex items-center gap-1">
                <span className="text-zinc-700">→</span>
                <span className="text-white font-bold">{gs.pendingStation}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ===== メイン ===== */}
      <main className="flex-1 max-w-sm mx-auto w-full px-4 py-3 space-y-3 pb-8">

        {/* 5の倍数ルール警告 */}
        {phase === 'input' && next5x && (
          <div className="w-full py-2 px-3 bg-red-950 border border-red-700 rounded-lg">
            <div className="text-red-400 font-mono text-xs font-bold">
              ⚠️ 次（第{gs.currentTurn + 1}ターン）は県またぎ必須！
            </div>
            <div className="text-red-500 font-mono text-xs mt-0.5">
              前の都道府県と異なる都道府県の駅に移動すること
            </div>
          </div>
        )}

        {/* 現在地パタパタ */}
        <div>
          <div className="text-xs text-zinc-600 font-mono tracking-widest mb-1 text-center">
            {phase !== 'input'
              ? `第${gs.currentTurn}ターン 到着駅`
              : gs.currentTurn === 0 ? '出発駅' : `第${gs.currentTurn}ターン 現在地`}
          </div>
          <SplitFlap value={currentDisplayStation} isAnimating={isFlapping} duration={2500} />
        </div>

        {/* ===== PHASE: 入力 ===== */}
        {phase === 'input' && (
          <>
            {/* NEXT STATION エリア：候補から選択 */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-3">
              <div className="text-xs text-zinc-500 font-mono tracking-widest mb-2">
                NEXT STATION（第{gs.currentTurn + 1}ターン）
              </div>

              {/* 選択中の駅名プレビュー */}
              {selectedStation ? (
                <div className="mb-2">
                  <SplitFlap value={selectedStation} isAnimating={isFlappingNext} duration={1500} />
                </div>
              ) : (
                <div className="mb-2 py-3 text-center text-zinc-700 font-mono text-sm border border-zinc-800 rounded">
                  候補から駅を選択してください
                </div>
              )}

              <button
                onClick={handleArrival}
                disabled={!selectedStation.trim()}
                className="w-full py-3 bg-yellow-400 text-black rounded font-bold font-mono tracking-widest disabled:opacity-30 hover:bg-yellow-300 transition-colors"
              >
                到着確定 →
              </button>
            </div>

            {/* 候補メモ帳 */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800">
              <div className="px-3 pt-2 pb-1 text-xs font-mono text-zinc-500 tracking-widest">📝 候補メモ帳</div>
              <div className="px-3 pb-3 space-y-2">
                  {/* 候補追加フィールド */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={candidateInput}
                      onChange={e => setCandidateInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCandidate()}
                      placeholder="駅名を追加"
                      className="flex-1 bg-black border border-zinc-700 rounded px-2 py-2 text-white text-sm font-mono placeholder-zinc-700 focus:outline-none focus:border-yellow-400"
                    />
                    <button
                      onClick={handleAddCandidate}
                      disabled={!candidateInput.trim()}
                      className="px-3 py-2 bg-yellow-400 text-black rounded text-sm font-bold font-mono disabled:opacity-30"
                    >
                      追加
                    </button>
                  </div>
                  {/* 候補リスト（タップで選択確定） */}
                  {gs.candidates.length === 0 ? (
                    <div className="text-zinc-700 font-mono text-xs text-center py-2">
                      候補を追加してください
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {gs.candidates.map(c => (
                        <div key={c} className="flex items-center gap-2">
                          <button
                            onClick={() => handleSelectCandidate(c)}
                            className={`flex-1 text-left px-3 py-2 rounded font-mono text-sm transition-colors ${
                              selectedStation === c
                                ? 'bg-yellow-400 text-black font-bold'
                                : 'bg-zinc-800 text-white hover:bg-zinc-700 hover:text-yellow-400'
                            }`}
                          >
                            {selectedStation === c ? '✓ ' : ''}{c}
                          </button>
                          <button
                            onClick={() => handleRemoveCandidate(c)}
                            className="px-2 py-2 text-zinc-600 hover:text-red-400 text-sm font-mono"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>

            {/* 支出ボタン + 履歴ボタン */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowBudgetModal(true)}
                className="flex-1 py-2 border border-zinc-700 text-zinc-400 rounded-lg text-sm font-mono hover:border-yellow-400 hover:text-yellow-400 transition-colors"
              >
                💴 支出を記録
              </button>
              <button
                onClick={() => setShowBudgetDetail(true)}
                className="px-4 py-2 border border-zinc-700 text-zinc-400 rounded-lg text-sm font-mono hover:border-zinc-500 hover:text-zinc-200 transition-colors"
              >
                📋 履歴
              </button>
            </div>

            {/* ターン進捗バー */}
            <div>
              <div className="flex justify-between text-xs text-zinc-600 font-mono mb-1">
                <span>TURN {gs.currentTurn}</span>
                <span>/ {MAX_TURNS}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${(gs.currentTurn / MAX_TURNS) * 100}%` }} />
              </div>
            </div>
          </>
        )}

        {/* ===== PHASE: カード引き待ち ===== */}
        {phase === 'card_pending' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setShowBudgetModal(true)}
                className="flex-1 py-2 border border-zinc-700 text-zinc-500 rounded text-sm font-mono hover:border-yellow-400 hover:text-yellow-400">
                💴 支出を記録
              </button>
              <button onClick={() => setShowBudgetDetail(true)}
                className="px-4 py-2 border border-zinc-700 text-zinc-500 rounded text-sm font-mono hover:border-zinc-500">
                📋 履歴
              </button>
            </div>
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <div className="text-xs text-zinc-500 font-mono tracking-widest mb-3">MISSION CARD</div>
              <button onClick={handleDrawCard}
                className="w-full py-5 border-2 border-yellow-400 rounded-lg text-yellow-400 font-bold font-mono text-lg tracking-widest hover:bg-yellow-400 hover:text-black transition-colors">
                カードを引く
              </button>
            </div>
          </div>
        )}

        {/* ===== PHASE: カード表示 ===== */}
        {phase === 'card_drawn' && currentCard && (
          <div className="space-y-3">
            <div className={`rounded-lg border p-4 ${getCardBg(currentCard.type)} ${getCardColor(currentCard.type)}`}>
              <div className="text-xs tracking-widest mb-1 opacity-60 font-mono">
                {currentCard.type === 'normal' ? 'MISSION' :
                  currentCard.type === 'lucky' ? '🍀 LUCKY' :
                    currentCard.type === 'warp' ? '🌀 WARP' : '🛡 NULLIFY'}
              </div>
              <div className="font-bold text-xl font-mono mb-2">{currentCard.title}</div>
              <div className="text-sm opacity-80 mb-4 leading-relaxed">{currentCard.description}</div>

              {currentCard.type === 'lucky' && (
                <button onClick={() => handleCardDone(currentCard, { luckyExtend: true })}
                  className="w-full py-3 bg-yellow-400 text-black rounded font-bold font-mono tracking-widest hover:bg-yellow-300">
                  +1時間ゲット！
                </button>
              )}
              {currentCard.type === 'nullify' && (
                <button onClick={() => handleCardDone(currentCard, { nullifyAdd: true })}
                  className="w-full py-3 bg-blue-600 text-white rounded font-bold font-mono tracking-widest hover:bg-blue-500">
                  手持ちに追加（→{gs.nullifyCards + 1}枚）
                </button>
              )}
              {currentCard.type === 'warp' && (
                <div className="space-y-2">
                  <button onClick={() => handleCardDone(currentCard, { goWarp: true })}
                    className="w-full py-3 bg-purple-600 text-white rounded font-bold font-mono tracking-widest hover:bg-purple-500">
                    🌀 地方ワープルーレットへ
                  </button>
                  {gs.nullifyCards >= 2 && (
                    <button onClick={() => handleCardDone(currentCard, { nullifyCost: 2 })}
                      className="w-full py-2 border border-blue-800 text-blue-400 rounded text-sm font-mono hover:border-blue-500">
                      🛡 2枚使ってワープをスキップ
                    </button>
                  )}
                </div>
              )}
              {currentCard.type === 'normal' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button onClick={() => setShowBudgetModal(true)}
                      className="flex-1 py-2 border border-zinc-600 text-zinc-400 rounded text-sm font-mono hover:border-yellow-400">
                      💴 経費を記録
                    </button>
                    <button onClick={() => setShowBudgetDetail(true)}
                      className="px-3 py-2 border border-zinc-600 text-zinc-400 rounded text-sm font-mono hover:border-zinc-500">
                      📋
                    </button>
                  </div>
                  <button onClick={() => handleCardDone(currentCard)}
                    className="w-full py-3 bg-yellow-400 text-black rounded font-bold font-mono tracking-widest hover:bg-yellow-300">
                    ミッション完了！ →
                  </button>
                  {gs.nullifyCards >= 1 && (
                    <button onClick={() => handleCardDone(currentCard, { nullifyCost: 1 })}
                      className="w-full py-2 border border-blue-800 text-blue-400 rounded text-sm font-mono hover:border-blue-500">
                      🛡 1枚使ってスキップ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {statusMsg && (
          <div className="w-full py-2 bg-zinc-800 rounded-lg text-center text-sm text-zinc-300 font-mono">
            {statusMsg}
          </div>
        )}
      </main>

      {/* ===== トースト通知 ===== */}
      {budgetToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-green-900 border border-green-600 text-green-300 font-mono text-sm px-5 py-3 rounded-xl shadow-lg whitespace-nowrap">
          ✓ {budgetToast}
        </div>
      )}

      {/* ===== 支出追加モーダル ===== */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={() => setShowBudgetModal(false)}>
          <div className="w-full max-w-sm mx-auto bg-zinc-900 rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="text-white font-mono font-bold text-sm tracking-widest">💴 支出を記録</div>
            <input
              type="number" inputMode="numeric"
              value={budgetForm.amount}
              onChange={e => setBudgetForm({ ...budgetForm, amount: e.target.value })}
              placeholder="金額（円）"
              className="w-full bg-black border border-zinc-700 rounded px-3 py-3 text-white text-xl font-bold font-mono placeholder-zinc-700 focus:outline-none focus:border-yellow-400"
            />
            <input
              type="text"
              value={budgetForm.description}
              onChange={e => setBudgetForm({ ...budgetForm, description: e.target.value })}
              placeholder="内容（例: ラーメン代）"
              className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm font-mono placeholder-zinc-700 focus:outline-none focus:border-yellow-400"
            />
            <div className="flex flex-wrap gap-2">
              {BUDGET_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setBudgetForm({ ...budgetForm, category: cat })}
                  className={`px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
                    budgetForm.category === cat ? 'bg-yellow-400 text-black border-yellow-400' : 'border-zinc-700 text-zinc-400 hover:border-yellow-400'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBudgetModal(false)}
                className="flex-1 py-3 border border-zinc-700 text-zinc-400 rounded font-mono text-sm">
                キャンセル
              </button>
              <button onClick={handleAddBudget}
                disabled={!budgetForm.amount || !budgetForm.description.trim()}
                className="flex-1 py-3 bg-yellow-400 text-black rounded font-bold font-mono disabled:opacity-30">
                記録する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 支出詳細モーダル ===== */}
      {showBudgetDetail && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50" onClick={() => setShowBudgetDetail(false)}>
          <div className="w-full max-w-sm mx-auto bg-zinc-900 rounded-t-2xl p-5 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-mono font-bold text-sm tracking-widest">💴 支出一覧</div>
              <div className="text-yellow-400 font-mono font-bold">{formatYen(budgetRemaining)} 残</div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {gs.budget.length === 0 ? (
                <div className="text-zinc-600 font-mono text-sm text-center py-4">まだ記録なし</div>
              ) : (
                [...gs.budget].reverse().map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-zinc-800 rounded px-3 py-2">
                    <div>
                      <div className="text-white font-mono text-sm">{e.description}</div>
                      <div className="text-zinc-500 font-mono text-xs">{e.category}</div>
                    </div>
                    <div className="text-yellow-400 font-mono font-bold">¥{e.amount.toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between font-mono text-sm">
              <span className="text-zinc-400">合計使用</span>
              <span className="text-white font-bold">¥{(gs.budgetLimit - budgetRemaining).toLocaleString()}</span>
            </div>
            <button onClick={() => setShowBudgetDetail(false)}
              className="mt-3 w-full py-3 border border-zinc-700 text-zinc-400 rounded font-mono text-sm">
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
