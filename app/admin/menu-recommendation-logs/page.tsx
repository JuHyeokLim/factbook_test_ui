"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, Search, AlertCircle, CheckCircle2 } from "lucide-react"

// 간단한 컴포넌트들
const Badge = ({ children, variant, className }: any) => {
  const variantClasses =
    variant === "destructive"
      ? "bg-red-100 text-red-800 border-red-200"
      : "bg-green-100 text-green-800 border-green-200"
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full border ${variantClasses} ${className}`}
    >
      {children}
    </span>
  )
}

interface MenuRecommendationLog {
  id: number
  factbook_id: number | null
  company_name: string
  product_name: string | null
  category: string | null
  proposals: string[] | null
  competitors: string[] | null
  target_users: string[] | null
  prompt: string
  api_params: any
  response_content: string | null
  recommended_items: {
    market?: string[]
    ownCompany?: string[]
    competitor?: string[]
    target?: string[]
  } | null
  error_message: string | null
  error_type: string | null
  created_at: string
}

export default function MenuRecommendationLogsPage() {
  const [logs, setLogs] = useState<MenuRecommendationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<MenuRecommendationLog | null>(null)
  const [activeTab, setActiveTab] = useState("prompt")
  const [filters, setFilters] = useState({
    factbook_id: "",
    company_name: "",
  })
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const params = new URLSearchParams()
      // 필터는 선택사항으로만 사용 (기본값은 전체 조회)
      if (filters.factbook_id && filters.factbook_id.trim()) {
        params.append("factbook_id", filters.factbook_id.trim())
      }
      if (filters.company_name && filters.company_name.trim()) {
        params.append("company_name", filters.company_name.trim())
      }
      params.append("limit", "200")  // 더 많은 로그 표시
      params.append("offset", "0")

      const response = await fetch(
        `${backendUrl}/api/admin/menu-recommendation-logs?${params.toString()}`
      )
      if (!response.ok) {
        throw new Error("로그 조회 실패")
      }

      const data = await response.json()
      setLogs(data.logs || [])
      setTotalCount(data.total_count || 0)
    } catch (error) {
      console.error("로그 조회 실패:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    fetchLogs()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString("ko-KR")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">메뉴 추천 로그</h1>
          <p className="text-muted-foreground mt-2">
            Gemini API를 통한 메뉴 항목 추천 로그를 확인할 수 있습니다.
          </p>
        </div>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 (선택사항)</CardTitle>
          <CardDescription>
            필터 없이 조회하면 전체 로그가 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">팩트북 ID (선택)</label>
              <Input
                placeholder="팩트북 ID로 필터링 (선택사항)"
                value={filters.factbook_id}
                onChange={(e) => handleFilterChange("factbook_id", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">회사명 (선택)</label>
              <Input
                placeholder="회사명으로 필터링 (선택사항)"
                value={filters.company_name}
                onChange={(e) => handleFilterChange("company_name", e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              검색
            </Button>
            {(filters.factbook_id || filters.company_name) && (
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ factbook_id: "", company_name: "" })
                  setTimeout(() => fetchLogs(), 100)
                }}
              >
                필터 초기화
              </Button>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            총 {totalCount}개의 로그
          </div>
        </CardContent>
      </Card>

      {/* 로그 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>로그 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                로그가 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLog?.id === log.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{log.company_name}</span>
                          {log.error_message ? (
                            <Badge variant="destructive">에러</Badge>
                          ) : (
                            <Badge>성공</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {log.product_name && (
                            <div>상품: {log.product_name}</div>
                          )}
                          {log.category && <div>카테고리: {log.category}</div>}
                          {log.factbook_id && (
                            <div>팩트북 ID: {log.factbook_id}</div>
                          )}
                          <div>생성일: {formatDate(log.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 로그 상세 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>로그 상세</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLog ? (
              <div className="space-y-4">
                {/* 탭 */}
                <div className="flex gap-2 border-b">
                  <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "prompt"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground"
                    }`}
                    onClick={() => setActiveTab("prompt")}
                  >
                    프롬프트
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "response"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground"
                    }`}
                    onClick={() => setActiveTab("response")}
                  >
                    응답
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "params"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground"
                    }`}
                    onClick={() => setActiveTab("params")}
                  >
                    파라미터
                  </button>
                </div>

                {/* 내용 */}
                <div className="max-h-[500px] overflow-y-auto">
                  {activeTab === "prompt" && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">입력 정보</h3>
                        <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                          <div>
                            <strong>회사명:</strong> {selectedLog.company_name}
                          </div>
                          {selectedLog.product_name && (
                            <div>
                              <strong>상품명:</strong> {selectedLog.product_name}
                            </div>
                          )}
                          {selectedLog.category && (
                            <div>
                              <strong>카테고리:</strong> {selectedLog.category}
                            </div>
                          )}
                          {selectedLog.proposals && selectedLog.proposals.length > 0 && (
                            <div>
                              <strong>제안 내용:</strong>{" "}
                              {selectedLog.proposals.join(", ")}
                            </div>
                          )}
                          {selectedLog.competitors &&
                            selectedLog.competitors.length > 0 && (
                              <div>
                                <strong>경쟁사:</strong>{" "}
                                {selectedLog.competitors.join(", ")}
                              </div>
                            )}
                          {selectedLog.target_users &&
                            selectedLog.target_users.length > 0 && (
                              <div>
                                <strong>타겟 사용자:</strong>{" "}
                                {selectedLog.target_users.join(", ")}
                              </div>
                            )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">프롬프트</h3>
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                          {selectedLog.prompt}
                        </pre>
                      </div>
                    </div>
                  )}

                  {activeTab === "response" && (
                    <div className="space-y-4">
                      {selectedLog.error_message ? (
                        <div>
                          <h3 className="font-semibold mb-2 text-destructive">에러</h3>
                          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                            <div className="text-sm">
                              <strong>에러 타입:</strong> {selectedLog.error_type}
                            </div>
                            <div className="text-sm mt-2">
                              <strong>에러 메시지:</strong>
                            </div>
                            <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                              {selectedLog.error_message}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <>
                          {selectedLog.recommended_items && (
                            <div>
                              <h3 className="font-semibold mb-2">추천된 메뉴 항목</h3>
                              <div className="bg-muted p-4 rounded-lg space-y-4">
                                {selectedLog.recommended_items.market && (
                                  <div>
                                    <strong className="text-sm">시장 현황:</strong>
                                    <ul className="mt-2 space-y-1 text-sm">
                                      {selectedLog.recommended_items.market.map(
                                        (item, idx) => (
                                          <li key={idx} className="list-disc list-inside">
                                            {item}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                                {selectedLog.recommended_items.ownCompany && (
                                  <div>
                                    <strong className="text-sm">자사 분석:</strong>
                                    <ul className="mt-2 space-y-1 text-sm">
                                      {selectedLog.recommended_items.ownCompany.map(
                                        (item, idx) => (
                                          <li key={idx} className="list-disc list-inside">
                                            {item}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                                {selectedLog.recommended_items.competitor && (
                                  <div>
                                    <strong className="text-sm">경쟁사 분석:</strong>
                                    <ul className="mt-2 space-y-1 text-sm">
                                      {selectedLog.recommended_items.competitor.map(
                                        (item, idx) => (
                                          <li key={idx} className="list-disc list-inside">
                                            {item}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                                {selectedLog.recommended_items.target && (
                                  <div>
                                    <strong className="text-sm">타겟 분석:</strong>
                                    <ul className="mt-2 space-y-1 text-sm">
                                      {selectedLog.recommended_items.target.map(
                                        (item, idx) => (
                                          <li key={idx} className="list-disc list-inside">
                                            {item}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedLog.response_content && (
                            <div>
                              <h3 className="font-semibold mb-2">원본 응답</h3>
                              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                                {selectedLog.response_content}
                              </pre>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === "params" && (
                    <div>
                      <h3 className="font-semibold mb-2">API 파라미터</h3>
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.api_params, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                로그를 선택하세요.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

