'use client'

import { useEffect, useState, useRef } from 'react'

const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン亜以宇恵於'

interface SplitFlapProps {
  value: string
  isAnimating: boolean
  onDone?: () => void
  duration?: number // ms
}

function SplitFlapChar({ target, isAnimating, delay }: { target: string; isAnimating: boolean; delay: number }) {
  const [display, setDisplay] = useState('　')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAnimating) {
      setDisplay(target)
      return
    }

    const startTime = Date.now() + delay
    const endTime = startTime + 1800

    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (Date.now() >= endTime) {
          clearInterval(intervalRef.current!)
          setDisplay(target)
        } else {
          setDisplay(CHARS[Math.floor(Math.random() * CHARS.length)])
        }
      }, 60)
    }, delay)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [target, isAnimating, delay])

  return (
    <span className="inline-block w-10 h-14 leading-none text-center align-middle border border-zinc-700 bg-zinc-900 mx-0.5 relative overflow-hidden">
      <span
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-yellow-400"
        style={{ fontFamily: 'monospace' }}
      >
        {display}
      </span>
      {/* 折れ目のライン */}
      <span className="absolute inset-x-0 top-1/2 h-px bg-zinc-700 opacity-60 pointer-events-none" />
    </span>
  )
}

export default function SplitFlap({ value, isAnimating, onDone, duration = 2500 }: SplitFlapProps) {
  const chars = value.split('')

  useEffect(() => {
    if (!isAnimating) return
    const timer = setTimeout(() => {
      onDone?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [isAnimating, duration, onDone])

  return (
    <div className="flex flex-wrap justify-center gap-0 p-4 bg-black rounded-lg border border-zinc-800">
      {chars.length === 0 ? (
        <span className="text-zinc-600 text-xl">---</span>
      ) : (
        chars.map((ch, i) => (
          <SplitFlapChar
            key={i}
            target={ch}
            isAnimating={isAnimating}
            delay={i * 120}
          />
        ))
      )}
    </div>
  )
}
