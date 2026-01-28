"use client"

import { useState, useEffect } from "react"
import { Plus, Sparkles, RefreshCw, Pencil } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RecommendationBarProps {
  factbookId: number
  sectionType: string
  sectionTitle: string
  relatedQuestions: string[]
  existingTitles: string[]
  onItemAdded: (newItemId?: number) => void | Promise<void>
  // 전역 추가 상태
  isAddingItem: boolean
  setIsAddingItem: (value: boolean) => void
  addingSection: string | null
  setAddingSection: (value: string | null) => void
}

export function RecommendationBar({ 
  factbookId, 
  sectionType, 
  sectionTitle,
  relatedQuestions,
  existingTitles,
  onItemAdded,
  isAddingItem,
  setIsAddingItem,
  addingSection,
  setAddingSection
}: RecommendationBarProps) {
  const [adding, setAdding] = useState<string | null>(null)
  const [showDirectInput, setShowDirectInput] = useState(false)
  const [directInputValue, setDirectInputValue] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [localRecommendations, setLocalRecommendations] = useState<string[]>([])
  const { toast } = useToast()
  
  // 현재 섹션에서 추가 중인지 확인
  const isAddingInThisSection = isAddingItem && addingSection === sectionType
  
  // 다른 섹션에서 추가 중인지 확인
  const isAddingInOtherSection = isAddingItem && addingSection !== sectionType

  // relatedQuestions가 변경될 때만 (DB 데이터가 새로 로드될 때만) 초기화
  useEffect(() => {
    if (relatedQuestions && relatedQuestions.length > 0) {
      const filtered = relatedQuestions
        .filter(q => !existingTitles.includes(q))
        .slice(0, 3)
      setLocalRecommendations(filtered)
    }
  }, [relatedQuestions]) // existingTitles는 의존성에서 제거 (참조값이 매번 바뀌므로)

  // 표시용 추천 목록 (현재 목록에서 이미 존재하는 항목은 실시간으로 필터링)
  const displayRecommendations = localRecommendations
    .filter(q => !existingTitles.includes(q))
    .slice(0, 3)

  // AI로 다시 추천받기
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const res = await fetch(`${backendUrl}/api/factbooks/${factbookId}/sections/${sectionType}/recommendations/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_type: sectionType,
          existing_titles: existingTitles
        })
      })

      if (!res.ok) {
        throw new Error('새로운 추천을 가져오는데 실패했습니다')
      }

      const data = await res.json()
      setLocalRecommendations(data.recommendations || [])
      
      toast({
        title: "✨ AI 추천 완료",
        description: "새로운 주제 3개를 추천해 드립니다.",
      })
    } catch (error: any) {
      console.error('추천 새로고침 실패:', error)
      toast({
        title: "❌ 추천 실패",
        description: error.message || "다시 시도해주세요.",
        variant: "destructive"
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDirectInputSubmit = async () => {
    const title = directInputValue.trim()
    if (!title) {
      toast({ title: "입력 오류", description: "항목명을 입력해주세요", variant: "destructive" })
      return
    }
    if (title.length > 500) {
      toast({ title: "입력 오류", description: "항목명은 500자 이내로 입력해주세요", variant: "destructive" })
      return
    }
    setShowDirectInput(false)
    setDirectInputValue("")
    await handleAddItem(title)
  }

  const handleAddItem = async (title: string) => {
    // ✅ 전역 플래그 설정
    setIsAddingItem(true)
    setAddingSection(sectionType)
    setAdding(title)
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const res = await fetch(`${backendUrl}/api/factbooks/${factbookId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_type: sectionType, title: title })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || '항목 추가에 실패했습니다')
      }
      const data = await res.json()
      const newItemId = data?.item?.id != null ? Number(data.item.id) : undefined
      toast({ title: "✅ 항목 추가 완료", description: `'${title}'이(가) 추가되었습니다` })
      await onItemAdded(newItemId)
    } catch (error: any) {
      console.error('항목 추가 실패:', error)
      toast({ title: "❌ 항목 추가 실패", description: error.message || "실패했습니다.", variant: "destructive" })
    } finally {
      // ✅ 전역 플래그 해제
      setIsAddingItem(false)
      setAddingSection(null)
      setAdding(null)
    }
  }

  if (displayRecommendations.length === 0 && !isRefreshing) return null

  return (
    <>
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-bold text-blue-900">이런 주제는 어떤가요?</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDirectInput(!showDirectInput)}
              disabled={isAddingItem}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3 h-3" />
              {isAddingInOtherSection ? '추가 중...' : '직접 입력'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isAddingItem}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isAddingInOtherSection ? '추가 중...' : '다시 추천'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {isRefreshing ? (
            <div className="py-8 text-center bg-white/50 rounded-lg border border-dashed border-blue-200">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                <span className="text-[11px] text-blue-600 font-medium">AI가 새로운 주제를 생각하고 있습니다...</span>
              </div>
            </div>
          ) : (
            displayRecommendations.map((rec, idx) => (
              <button
                key={idx}
                onClick={() => handleAddItem(rec)}
                disabled={isAddingItem || isRefreshing}
                className="w-full text-left px-3 py-2.5 bg-white/80 rounded-lg border border-blue-100 hover:border-blue-300 hover:bg-white transition-all text-[13px] text-slate-700 disabled:opacity-50 flex items-center gap-2 group shadow-sm hover:shadow"
              >
                <span className="flex-1 line-clamp-1 font-medium">
                  {rec}
                </span>
                {adding === rec ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-600 shrink-0">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>생성 중...</span>
                  </div>
                ) : isAddingInOtherSection ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                    <span>다른 항목 추가 중...</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* 주제 입력창 노출 (직접 입력 클릭 시) */}
        {showDirectInput && !isRefreshing && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={directInputValue}
              onChange={(e) => setDirectInputValue(e.target.value)}
              placeholder="주제를 입력하세요."
              disabled={isAddingItem}
              maxLength={500}
              className="flex-1 min-w-0 px-3 py-2 text-[13px] border border-blue-200 rounded-lg bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && handleDirectInputSubmit()}
            />
            <button
              onClick={handleDirectInputSubmit}
              disabled={isAddingItem || !directInputValue.trim()}
              className="shrink-0 px-4 py-2 text-[13px] font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </>
  )
}
