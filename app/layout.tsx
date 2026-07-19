import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "SHIRITORI TRIP",
  description: "駅名しりとり旅行ゲーム",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-black text-white font-mono">
        {children}
      </body>
    </html>
  )
}
