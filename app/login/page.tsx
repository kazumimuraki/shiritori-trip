'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/')
      else setChecking(false)
    })
  }, [])

  async function handleGitHubLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      console.error(error)
      setLoading(false)
    }
  }

  if (checking) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <span className="text-zinc-600 font-mono tracking-widest">LOADING...</span>
    </div>
  )

  return (
    <main className="min-h-screen bg-black flex flex-col p-6">
      {/* 上半分：ロゴ＋タイトル */}
      <div className="flex-1 flex flex-col items-center justify-end pb-8">
        <img src="/crra-logo.png" alt="CRRA" className="mb-8" style={{ height: '72px' }} />
        <div className="text-yellow-400 font-mono font-bold text-center" style={{ fontSize: '3rem', letterSpacing: '0.2em', lineHeight: 1.1 }}>
          SHIRITORI
        </div>
        <div className="text-yellow-400 font-mono font-bold text-center" style={{ fontSize: '1.8rem', letterSpacing: '0.5em' }}>
          TRIP
        </div>
        <p className="text-zinc-500 text-sm mt-4 font-mono tracking-widest">
          スマホ禁止！駅名しりとりの旅
        </p>
      </div>

      {/* 下半分：ボタン */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 max-w-sm w-full mx-auto">
        <button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-white font-bold py-4 px-6 rounded-lg hover:bg-zinc-700 active:bg-zinc-600 transition-colors disabled:opacity-50 font-mono text-lg"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          {loading ? 'サインイン中...' : 'GitHub でサインイン'}
        </button>
        <p className="text-zinc-700 text-xs font-mono mt-4">
          このアプリは関係者限定です
        </p>
      </div>
    </main>
  )
}
