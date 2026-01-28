"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AddItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  factbookId: number
  sectionType: string
  sectionTitle: string
  onItemAdded: () => void
  // 전역 추가 상태
  isAddingItem: boolean
  setIsAddingItem: (value: boolean) => void
  addingSection: string | null
  setAddingSection: (value: string | null) => void
}

export function AddItemModal({
  open,
  onOpenChange,
  factbookId,
  sectionType,
  sectionTitle,
  onItemAdded,
  isAddingItem,
  setIsAddingItem,
  addingSection,
  setAddingSection
}: AddItemModalProps) {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "항목명을 입력해주세요",
        variant: "destructive"
      })
      return
    }

    if (title.length > 500) {
      toast({
        title: "입력 오류",
        description: "항목명은 500자 이내로 입력해주세요",
        variant: "destructive"
      })
      return
    }

    // ✅ 전역 플래그 설정
    setIsAddingItem(true)
    setAddingSection(sectionType)
    setLoading(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const res = await fetch(`${backendUrl}/api/factbooks/${factbookId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_type: sectionType,
          title: title.trim()
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || '항목 추가에 실패했습니다')
      }

      // 성공
      toast({
        title: "✅ 항목 추가 완료",
        description: `'${title}'이(가) 추가되었습니다`,
      })

      // 상태 초기화
      setTitle("")
      
      // 부모 컴포넌트에 알림
      onItemAdded()

    } catch (error: any) {
      console.error('항목 추가 실패:', error)
      toast({
        title: "❌ 항목 추가 실패",
        description: error.message || "항목 추가에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive"
      })
    } finally {
      // ✅ 전역 플래그 해제
      setIsAddingItem(false)
      setAddingSection(null)
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">항목 추가</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            <span className="font-semibold text-slate-700">{sectionTitle}</span> 섹션에 새로운 항목을 추가합니다
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              항목명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 경영진 소개, 신제품 라인, 마케팅 전략 등"
              disabled={loading}
              maxLength={500}
              className="text-sm"
            />
            <p className="text-xs text-slate-400">
              {title.length}/500자
            </p>
          </div>

          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">AI가 콘텐츠를 생성하고 있습니다</p>
                  <p className="text-xs text-blue-600 mt-1">약 20초 정도 소요됩니다. 잠시만 기다려주세요...</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                "추가하기"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
