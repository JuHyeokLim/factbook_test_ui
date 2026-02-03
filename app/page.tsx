"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FactbookList } from "@/components/factbook/factbook-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateClick = () => {
    router.push("/factbook/create")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* 로고: 별 아웃라인 + 스파클 (메인 컬러 #295DFA) - 큰 별 중앙, 작은 별 왼쪽 아래·오른쪽 위 */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden>
              <path d="M16 4L18.5 12.5L27 15L18.5 17.5L16 26L13.5 17.5L5 15L13.5 12.5L16 4Z" stroke="#295DFA" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
              <path d="M7 23L8 24.5L9.5 24L9 22.5L7 23Z" stroke="#295DFA" strokeWidth="1" strokeLinejoin="round" fill="none" />
              <path d="M23 7L24 8.5L25.5 8L25 6.5L23 7Z" stroke="#295DFA" strokeWidth="1" strokeLinejoin="round" fill="none" />
            </svg>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#295DFA] to-[#68A3F5] bg-clip-text text-transparent">
              팩트북 AI
            </h1>
          </div>
          <Button onClick={handleCreateClick} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            새 팩트북 만들기
          </Button>
        </div>

        {/* Factbook List */}
        <FactbookList key={refreshTrigger} />
      </div>
    </main>
  )
}
