"use client"

import { useState } from "react"
import { FactbookList } from "@/components/factbook/factbook-list"
import { CreateFactbookModal } from "@/components/factbook/create-factbook-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateSuccess = () => {
    setIsModalOpen(false)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">팩트북 생성 AI Agent</h1>
            <p className="text-muted-foreground">기업명으로 팩트북을 검색하세요</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            새 팩트북 만들기
          </Button>
        </div>

        {/* Factbook List */}
        <FactbookList key={refreshTrigger} />

        {/* Create Modal */}
        <CreateFactbookModal open={isModalOpen} onOpenChange={setIsModalOpen} onCreateSuccess={handleCreateSuccess} />
      </div>
    </main>
  )
}
