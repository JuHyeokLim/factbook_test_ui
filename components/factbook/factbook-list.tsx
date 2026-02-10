"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreVertical, Eye, Grid3x3, List, ChevronLeft, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Factbook {
  id: string
  companyName: string
  productName: string
  category: string
  status: "draft" | "generating" | "completed" | "failed" | "queued"
  createdAt: string
  updatedAt: string
  rawCreatedAt: string
  menuItems: any
  queuePosition?: number
  estimatedWaitTime?: number
}

const PAGE_SIZE = 30

export function FactbookList() {
  const [factbooks, setFactbooks] = useState<Factbook[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchFactbooks = useCallback(
    async (options: { showLoading?: boolean; silent?: boolean } = {}) => {
      const { showLoading = false, silent = false } = options
      if (showLoading) {
        setLoading(true)
      }
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("limit", String(PAGE_SIZE))
        params.set("sort", sortBy)
        if (searchQuery.trim()) params.set("search", searchQuery.trim())
        if (category && category !== "all") params.set("category", category)
        const response = await fetch(`${backendUrl}/api/factbooks?${params.toString()}`)

        if (!response.ok) {
          throw new Error("팩트북 목록 조회 실패")
        }

        const data = await response.json()

        const items: Factbook[] = (data.items || []).map((item: any) => ({
          id: String(item.id),
          companyName: item.company_name || "",
          productName: item.product_name || "",
          category: item.category || "기타",
          status: item.status || "draft",
          menuItems: item.menu_items || {},
          createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString("ko-KR") : "",
          updatedAt: item.updated_at ? new Date(item.updated_at).toLocaleDateString("ko-KR") : "",
          rawCreatedAt: item.created_at || "",
          queuePosition: item.queue_position,
          estimatedWaitTime: item.estimated_wait_time,
        }))

        setFactbooks(items)
        setTotal(data.total ?? 0)

        // 현재 페이지가 비었고 이전 페이지가 있으면 이전 페이지로
        if (items.length === 0 && data.page > 1 && (data.total ?? 0) > 0) {
          setPage(data.page - 1)
        }
      } catch (error) {
        console.error("팩트북 목록 조회 실패:", error)
        if (!silent) {
          toast({
            title: "팩트북 목록을 불러오는데 실패했습니다.",
            variant: "destructive",
          })
        }
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [page, searchQuery, category, sortBy, toast],
  )

  // const calculateEstimatedCompletionTime = (factbook: Factbook) => {
  /** 예상 소요 시간(분). null이면 표시 불가. */
  const calculateEstimatedCompletionMinutes = (factbook: Factbook): number | null => {
    if (!factbook.menuItems || !factbook.rawCreatedAt) return null

    const weights = {
      dart_basic: 10,
      dart_finance: 35, // 15 + viz*2
      pplx_normal: 25,
      pplx_deep: 60, // 35 + viz*1
    }

    const sectionTimes = Object.keys(factbook.menuItems).map((section) => {
      const tasks = factbook.menuItems[section]
      if (!Array.isArray(tasks) || tasks.length === 0) return 0

      let total = 0
      tasks.forEach((taskName: string) => {
        if (taskName.includes("기본 정보")) total += weights.dart_basic
        else if (taskName.includes("재무 정보")) total += weights.dart_finance
        else if (
          taskName.includes("역사") ||
          taskName.includes("SWOT") ||
          taskName.includes("인사이트") ||
          taskName.includes("분석")
        ) {
          total += weights.pplx_deep
        } else {
          total += weights.pplx_normal
        }
      })
      return total
    })

    // 대기 시간이 있으면 추가
    // const totalWaitSeconds = maxSectionTimeSeconds + (factbook.estimatedWaitTime || 0)
    
    // // 서버(UTC) 시간을 한국 시간(KST)으로 강제 변환하기 위해 9시간을 더함
    // const date = new Date(factbook.rawCreatedAt)
    // date.setHours(date.getHours() + 9)
    // date.setSeconds(date.getSeconds() + totalWaitSeconds)

    // const h = String(date.getHours()).padStart(2, "0")
    // const m = String(date.getMinutes()).padStart(2, "0")
    
    // return `${h}:${m}`

    const maxSectionTimeSeconds = Math.max(...sectionTimes, 0) + 10 // buffer
    const totalWaitSeconds = maxSectionTimeSeconds + (factbook.estimatedWaitTime || 0) + 30 // 실제 완료가 예상보다 약 30초 늦어서 반영
    const minutes = Math.max(1, Math.ceil(totalWaitSeconds / 60))
    return minutes
  }

  useEffect(() => {
    fetchFactbooks({ showLoading: true })
  }, [fetchFactbooks])

  // 검색/업종/정렬 변경 시 1페이지로
  useEffect(() => {
    setPage(1)
  }, [searchQuery, category, sortBy])

  useEffect(() => {
    if (!factbooks.length) {
      return
    }
    const hasPending = factbooks.some((fb) => fb.status === "generating" || fb.status === "draft" || fb.status === "queued")
    if (!hasPending) {
      return
    }

    const intervalId = window.setInterval(() => {
      fetchFactbooks({ silent: true })
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [factbooks, fetchFactbooks])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleShare = (id: string) => {
    const shareUrl = `${window.location.origin}/factbook/${id}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "공유 링크가 복사되었습니다.",
      duration: 1000,
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("팩트북을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const response = await fetch(`${backendUrl}/api/factbooks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "삭제 실패" }))
        throw new Error(errorData.detail || "팩트북 삭제에 실패했습니다.")
      }

      setFactbooks((prev) => prev.filter((fb) => fb.id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      
      toast({
        title: "팩트북이 삭제되었습니다.",
        duration: 2000,
      })
    } catch (error) {
      console.error("팩트북 삭제 실패:", error)
      toast({
        title: "팩트북 삭제에 실패했습니다.",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">팩트북을 불러오는 중입니다...</div>
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <Input
          placeholder="기업명으로 팩트북을 검색하세요"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(1)
          }}
          className="flex-1"
        />
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="업종 선택" />
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            <SelectItem value="all">모든 업종</SelectItem>
            <SelectItem value="기초재">기초재</SelectItem>
            <SelectItem value="식품">식품</SelectItem>
            <SelectItem value="음료및기호식품">음료 및 기호식품</SelectItem>
            <SelectItem value="제약및의료">제약 및 의료</SelectItem>
            <SelectItem value="화장품및보건용품">화장품 및 보건용품</SelectItem>
            <SelectItem value="출판">출판</SelectItem>
            <SelectItem value="패션">패션</SelectItem>
            <SelectItem value="산업기기">산업기기</SelectItem>
            <SelectItem value="정밀기기및사무기기">정밀기기 및 사무기기</SelectItem>
            <SelectItem value="가정용전기전자">가정용 전기전자</SelectItem>
            <SelectItem value="컴퓨터및정보통신">컴퓨터 및 정보통신</SelectItem>
            <SelectItem value="수송기기">수송기기</SelectItem>
            <SelectItem value="가정용품">가정용품</SelectItem>
            <SelectItem value="화학공업">화학공업</SelectItem>
            <SelectItem value="건설건재및부동산">건설, 건재 및 부동산</SelectItem>
            <SelectItem value="유통">유통</SelectItem>
            <SelectItem value="금융보험및증권">금융, 보험 및 증권</SelectItem>
            <SelectItem value="서비스">서비스</SelectItem>
            <SelectItem value="관공서및단체">관공서 및 단체</SelectItem>
            <SelectItem value="교육및복지후생">교육 및 복지후생</SelectItem>
            <SelectItem value="그룹및기업광고">그룹 및 기업광고</SelectItem>
            <SelectItem value="기타">기타</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1) }}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">최근 업데이트</SelectItem>
            <SelectItem value="name">가나다순</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 border border-border rounded-md p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            title="그리드 보기"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            title="리스트 보기"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">총 {total}개</div>

      {/* Factbook Grid or List */}
      {factbooks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-lg font-medium text-foreground mb-2">팩트북이 없습니다</p>
          <p className="text-sm text-muted-foreground">새로운 팩트북을 생성해보세요.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factbooks.map((factbook) => (
            <Card key={factbook.id} className="p-6 hover:shadow-lg transition-shadow flex flex-col">
              <div className="space-y-4 flex-1">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{factbook.companyName}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{factbook.productName}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleShare(factbook.id)}>공유</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(factbook.id)} className="text-destructive">
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <span className="inline-block text-xs bg-[#E8EEFE] text-[#295DFA] px-2 py-1 rounded font-medium">
                    {factbook.category}
                  </span>
                </div>

                {factbook.status === "failed" ? (
                  <div className="text-sm text-destructive">생성 실패</div>
                ) : factbook.status === "completed" ? (
                  <Link href={`/factbook/${factbook.id}`} className="block">
                    <Button className="w-full gap-2 bg-transparent" variant="outline">
                      <Eye className="w-4 h-4" />
                      팩트북 보기
                    </Button>
                  </Link>
                ) : (
                  <div className="text-sm text-muted-foreground flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>
                        {factbook.status === "draft" 
                          ? "생성 준비 중..." 
                          : "생성 중..."}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 font-medium ml-6">
                      {/* 예상 완료 시간: {calculateEstimatedCompletionTime(factbook) || "--:--"} */}
                      약 {calculateEstimatedCompletionMinutes(factbook) ?? "--"}분 소요 예정
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>생성: {factbook.createdAt}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {factbooks.map((factbook) => (
            <Card key={factbook.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{factbook.companyName}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{factbook.productName}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{factbook.category}</span>
                    <span>생성: {factbook.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {factbook.status === "failed" ? (
                    <div className="text-sm text-destructive">생성 실패</div>
                  ) : factbook.status === "completed" ? (
                    <Link href={`/factbook/${factbook.id}`}>
                      <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                        <Eye className="w-4 h-4" />
                        보기
                      </Button>
                    </Link>
                  ) : (
                    <div className="text-sm text-muted-foreground flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span>
                          {factbook.status === "draft" 
                            ? "생성 준비 중..." 
                            : "생성 중..."}
                        </span>
                      </div>
                      <div className="text-xs text-blue-600 font-medium ml-6">
                        {/* 예상 완료 시간: {calculateEstimatedCompletionTime(factbook) || "--:--"} */}
                        약 {calculateEstimatedCompletionMinutes(factbook) ?? "--"}분 소요 예정
                      </div>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShare(factbook.id)}>공유</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(factbook.id)} className="text-destructive">
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {total}개 중 {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, total)} 표시
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
