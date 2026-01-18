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
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">팩트북 AI</h1>
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
