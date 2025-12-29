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

// 간단한 컴포넌트들 (추후 shadcn/ui로 교체 가능)
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

interface GenerationLog {
  id: number
  factbook_id: number
  section_type: string
  sub_section_title: string
  system_prompt: string
  user_prompt: string
  api_params: any
  response_content: string | null
  sources: any[] | null
  related_questions: any[] | null
  error_message: string | null
  error_type: string | null
  created_at: string
}

export default function GenerationLogsPage() {
  const [logs, setLogs] = useState<GenerationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<GenerationLog | null>(null)
  const [activeTab, setActiveTab] = useState("prompt")
  const [filters, setFilters] = useState({
    factbook_id: "",
    section_type: "all",
  })
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const params = new URLSearchParams()
      if (filters.factbook_id) {
        params.append("factbook_id", filters.factbook_id)
      }
      if (filters.section_type && filters.section_type !== "all") {
        params.append("section_type", filters.section_type)
      }
      params.append("limit", "100")
      params.append("offset", "0")

      const response = await fetch(
        `${backendUrl}/api/admin/generation-logs?${params.toString()}`
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
    return new Date(dateString).toLocaleString("ko-KR")
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
    }).format(amount)
  }

  const formatKRW = (amount: number) => {
    const krw = amount * 1350 // 환율 1,350원 가정
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(krw)
  }

  const getStatusBadge = (log: GenerationLog) => {
    if (log.error_message) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          에러
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="gap-1 bg-green-600">
        <CheckCircle2 className="w-3 h-3" />
        성공
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">팩트북 생성 로그 관리</h1>
        <p className="text-muted-foreground mt-2">
          Perplexity API 호출 로그를 확인하고 분석할 수 있습니다.
        </p>
      </div>

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">팩트북 ID</label>
              <Input
                placeholder="팩트북 ID 입력"
                value={filters.factbook_id}
                onChange={(e) => handleFilterChange("factbook_id", e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">섹션 타입</label>
              <Select
                value={filters.section_type}
                onValueChange={(value) => handleFilterChange("section_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="company">기업 정보</SelectItem>
                  <SelectItem value="market">시장 현황</SelectItem>
                  <SelectItem value="ownCompany">자사 분석</SelectItem>
                  <SelectItem value="competitor">경쟁사 분석</SelectItem>
                  <SelectItem value="target">타겟 분석</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                검색
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 로그</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>성공</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.filter((log) => !log.error_message).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>에러</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter((log) => log.error_message).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 로그 리스트 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 왼쪽: 로그 리스트 */}
        <Card>
          <CardHeader>
            <CardTitle>로그 리스트 ({logs.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] overflow-auto">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedLog?.id === log.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium">
                          [{log.section_type}] {log.sub_section_title}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          팩트북 #{log.factbook_id} • {formatDate(log.created_at)}
                        </div>
                        {log.api_params?.cost?.total_cost !== undefined && (
                          <div className="text-xs font-medium text-blue-600 mt-1">
                            비용: {formatKRW(log.api_params.cost.total_cost)} ({formatUSD(log.api_params.cost.total_cost)})
                          </div>
                        )}
                      </div>
                      {getStatusBadge(log)}
                    </div>
                    {log.error_message && (
                      <div className="text-sm text-red-600 mt-2">
                        {log.error_type}: {log.error_message.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 오른쪽: 상세 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>상세 정보</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedLog ? (
              <div className="h-[600px] overflow-auto">
                {/* 탭 버튼 */}
                <div className="flex gap-2 border-b mb-4">
                  <button
                    onClick={() => setActiveTab("prompt")}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      activeTab === "prompt"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    프롬프트
                  </button>
                  <button
                    onClick={() => setActiveTab("cost")}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      activeTab === "cost"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    비용
                  </button>
                  <button
                    onClick={() => setActiveTab("params")}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      activeTab === "params"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    파라미터
                  </button>
                  <button
                    onClick={() => setActiveTab("response")}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      activeTab === "response"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    응답
                  </button>
                  <button
                    onClick={() => setActiveTab("sources")}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      activeTab === "sources"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    출처
                  </button>
                </div>

                {/* 탭 내용 */}
                {activeTab === "prompt" && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">시스템 프롬프트</h3>
                      <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                        {selectedLog.system_prompt}
                      </div>
                    </div>
                    <div className="border-t my-4" />
                    <div>
                      <h3 className="font-semibold mb-2">사용자 프롬프트</h3>
                      <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                        {selectedLog.user_prompt}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "cost" && (
                  <div className="space-y-6">
                    {selectedLog.api_params?.cost ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="py-2 px-4">
                              <CardDescription>총 비용 (원화)</CardDescription>
                            </CardHeader>
                            <CardContent className="py-2 px-4">
                              <div className="text-xl font-bold text-blue-600">
                                {formatKRW(selectedLog.api_params.cost.total_cost)}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="py-2 px-4">
                              <CardDescription>총 비용 (USD)</CardDescription>
                            </CardHeader>
                            <CardContent className="py-2 px-4">
                              <div className="text-xl font-bold text-gray-700">
                                {formatUSD(selectedLog.api_params.cost.total_cost)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-2 text-sm">상세 사용량</h3>
                          <div className="bg-muted p-4 rounded-md">
                            <table className="w-full text-sm">
                              <tbody>
                                <tr className="border-b border-muted-foreground/20">
                                  <td className="py-2 text-muted-foreground">모델</td>
                                  <td className="py-2 font-medium text-right">{selectedLog.api_params.actual_model || selectedLog.api_params.model}</td>
                                </tr>
                                <tr className="border-b border-muted-foreground/20">
                                  <td className="py-2 text-muted-foreground">Input 토큰</td>
                                  <td className="py-2 font-medium text-right">{selectedLog.api_params.usage?.prompt_tokens?.toLocaleString()}</td>
                                </tr>
                                <tr className="border-b border-muted-foreground/20">
                                  <td className="py-2 text-muted-foreground">Output 토큰</td>
                                  <td className="py-2 font-medium text-right">{selectedLog.api_params.usage?.completion_tokens?.toLocaleString()}</td>
                                </tr>
                                {selectedLog.api_params.usage?.num_search_queries > 0 && (
                                  <tr className="border-b border-muted-foreground/20">
                                    <td className="py-2 text-muted-foreground">검색 쿼리</td>
                                    <td className="py-2 font-medium text-right">{selectedLog.api_params.usage.num_search_queries}회</td>
                                  </tr>
                                )}
                                {selectedLog.api_params.usage?.reasoning_tokens > 0 && (
                                  <tr className="border-b border-muted-foreground/20">
                                    <td className="py-2 text-muted-foreground">Reasoning 토큰</td>
                                    <td className="py-2 font-medium text-right">{selectedLog.api_params.usage.reasoning_tokens.toLocaleString()}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {selectedLog.api_params.cost.details && (
                          <div>
                            <h3 className="font-semibold mb-2 text-sm">비용 상세 (USD)</h3>
                            <div className="bg-muted p-4 rounded-md">
                              <table className="w-full text-xs text-muted-foreground">
                                <tbody>
                                  {Object.entries(selectedLog.api_params.cost.details).map(([key, value]: [string, any]) => (
                                    value > 0 && (
                                      <tr key={key}>
                                        <td className="py-1 capitalize">{key}</td>
                                        <td className="py-1 text-right">${value.toFixed(6)}</td>
                                      </tr>
                                    )
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                        비용 정보가 없는 로그입니다.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "params" && (
                  <div className="p-3 bg-muted rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedLog.api_params, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === "response" && (
                  <div>
                    {selectedLog.error_message ? (
                      <div className="space-y-2">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="font-semibold text-red-800 mb-1">
                            {selectedLog.error_type}
                          </div>
                          <div className="text-sm text-red-700">
                            {selectedLog.error_message}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">응답 내용</h3>
                          <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                            {selectedLog.response_content || "응답 없음"}
                          </div>
                        </div>
                        {selectedLog.related_questions &&
                          selectedLog.related_questions.length > 0 && (
                            <div>
                              <h3 className="font-semibold mb-2">관련 질문</h3>
                              <ul className="list-disc list-inside space-y-1">
                                {selectedLog.related_questions.map((q, idx) => (
                                  <li key={idx} className="text-sm">
                                    {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sources" && (
                  <div>
                    {selectedLog.sources && selectedLog.sources.length > 0 ? (
                      <div className="space-y-2">
                        {selectedLog.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="p-3 border rounded-md hover:bg-muted"
                          >
                            <div className="font-medium text-sm">{source.title}</div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                {source.url}
                              </a>
                            )}
                            {source.date && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {source.date}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">출처 없음</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                로그를 선택하세요
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

