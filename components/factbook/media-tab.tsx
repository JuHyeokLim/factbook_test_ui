"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface MediaTabProps {
  factbookId: string
}

interface MediaItem {
  id: string
  imageUrl: string
  platform: string
  date: string
}

export function MediaTab({ factbookId }: MediaTabProps) {
  const [selectedCompany, setSelectedCompany] = useState("lg")
  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [selectedMedia, setSelectedMedia] = useState<string[]>(["메타", "인스타그램", "구글", "Youtube"])
  const [isCollecting, setIsCollecting] = useState(false)
  const [hasCollected, setHasCollected] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])

  const companies = [
    { id: "lg", name: "LG 헬로비전" },
    { id: "comp1", name: "경쟁사 1" },
    { id: "comp2", name: "경쟁사 2" },
    { id: "comp3", name: "경쟁사 3" },
  ]

  const periods = [
    { value: "all", label: "기간 전체" },
    { value: "1m", label: "최근 1개월" },
    { value: "3m", label: "최근 3개월" },
    { value: "6m", label: "최근 6개월" },
    { value: "1y", label: "최근 1년" },
  ]

  const mediaOptions = ["메타", "인스타그램", "구글", "Youtube"]

  const handleStartCollection = () => {
    setIsCollecting(true)
    // 임시: 3초 후 수집 완료
    setTimeout(() => {
      setIsCollecting(false)
      setHasCollected(true)
      // 임시 데이터
      setMediaItems([
        { id: "1", imageUrl: "/placeholder.jpg", platform: "메타", date: "2024-11-01" },
        { id: "2", imageUrl: "/placeholder.jpg", platform: "인스타그램", date: "2024-11-02" },
      ])
    }, 3000)
  }

  const handleCancelCollection = () => {
    setIsCollecting(false)
  }

  const toggleMedia = (media: string) => {
    setSelectedMedia((prev) =>
      prev.includes(media) ? prev.filter((m) => m !== media) : [...prev, media]
    )
  }

  // 수집 전 상태
  if (!hasCollected && !isCollecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            아직 매체별 소재가 수집되지 않았습니다.
            <br />
            기업 및 경쟁사의 소재(DA)를 확인해 보세요.
          </p>
          <Button onClick={handleStartCollection} size="lg">
            + 매체 소재 확인하기
          </Button>
        </div>
      </div>
    )
  }

  // 수집 중 상태
  if (isCollecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <div>
            <p className="text-foreground font-medium mb-2">매체별 소재를 수집하고 있습니다.</p>
            <button onClick={handleCancelCollection} className="text-sm text-primary hover:underline">
              취소
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 수집 완료 상태
  const selectedMediaText = selectedMedia.length === mediaOptions.length 
    ? "매체 전체" 
    : selectedMedia.length === 0 
    ? "매체 선택" 
    : `${selectedMedia.length}개 선택`

  return (
    <div className="space-y-6">
      {/* 필터 영역 */}
      <div className="flex items-center justify-between gap-6">
        {/* 왼쪽: 회사 탭 */}
        <div className="flex gap-2">
          {companies.map((company) => (
            <Button
              key={company.id}
              variant={selectedCompany === company.id ? "default" : "outline"}
              onClick={() => setSelectedCompany(company.id)}
              className="whitespace-nowrap"
            >
              {company.name}
            </Button>
          ))}
        </div>

        {/* 오른쪽: 기간/매체 필터 */}
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value="custom" onValueChange={() => {}}>
            <SelectTrigger className="w-40">
              <SelectValue>{selectedMediaText}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {mediaOptions.map((media) => (
                <div
                  key={media}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted cursor-pointer"
                  onClick={() => toggleMedia(media)}
                >
                  <input
                    type="checkbox"
                    checked={selectedMedia.includes(media)}
                    onChange={() => toggleMedia(media)}
                    className="rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-sm">{media}</span>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaItems
          .filter((item) => selectedMedia.includes(item.platform))
          .map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">광고 이미지</span>
              </div>
              <div className="p-3 text-xs border-t">
                <p className="font-medium text-foreground">{item.platform}</p>
                <p className="text-muted-foreground mt-1">{item.date}</p>
              </div>
            </div>
          ))}
      </div>

      {mediaItems.filter((item) => selectedMedia.includes(item.platform)).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          선택한 필터에 해당하는 소재가 없습니다.
        </div>
      )}
    </div>
  )
}

