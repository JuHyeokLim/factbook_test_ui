"use client"

import React, { useState, useCallback } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Loader2,
  Play,
  FileText,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"

const SECTION_TYPES = [
  { value: "company", label: "기업 정보" },
  { value: "market", label: "시장 현황" },
  { value: "ownCompany", label: "자사 분석" },
  { value: "competitor", label: "경쟁사 분석" },
  { value: "target", label: "타겟 분석" },
] as const

interface PlaygroundContext {
  company_name: string
  section_type: string
  sub_section_title: string
  category: string
  product_name: string
  competitors: string
  target_users: string
  additional_request: string
}

interface PlaygroundResult {
  user_prompt_sent: string
  system_prompt_sent: string
  content: string | null
  sources: Array<{ title?: string; url?: string; date?: string }> | null
  error_message: string | null
  duration_seconds?: number
}

const defaultContext: PlaygroundContext = {
  company_name: "",
  section_type: "market",
  sub_section_title: "",
  category: "",
  product_name: "",
  competitors: "",
  target_users: "",
  additional_request: "",
}

export default function PlaygroundPage() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  const [context, setContext] = useState<PlaygroundContext>(defaultContext)
  const [systemPromptOverride, setSystemPromptOverride] = useState("")
  const [userPromptOverride, setUserPromptOverride] = useState("")
  const [useOverride, setUseOverride] = useState(false)
  const [previewPrompt, setPreviewPrompt] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingSystemPrompt, setLoadingSystemPrompt] = useState(false)
  const [loadingRun, setLoadingRun] = useState(false)
  const [result, setResult] = useState<PlaygroundResult | null>(null)
  const [copied, setCopied] = useState(false)
  // 실험 옵션: temperature, 도메인 필터, 날짜 필터
  const [temperature, setTemperature] = useState("")
  const [useCustomDomainFilter, setUseCustomDomainFilter] = useState(false)
  const [domainFilterText, setDomainFilterText] = useState("")
  const [searchAfterDate, setSearchAfterDate] = useState("")
  const [searchRecencyFilter, setSearchRecencyFilter] = useState("")

  const updateContext = useCallback(
    (field: keyof PlaygroundContext, value: string) => {
      setContext((prev) => ({ ...prev, [field]: value }))
      setPreviewPrompt(null)
    },
    []
  )

  const buildPreviewPayload = useCallback(() => {
    const competitorsList = context.competitors
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const targetUsersList = context.target_users
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      company_name: context.company_name,
      section_type: context.section_type,
      sub_section_title: context.sub_section_title,
      category: context.category || undefined,
      product_name: context.product_name || undefined,
      competitors: competitorsList.length ? competitorsList : undefined,
      target_users: targetUsersList.length ? targetUsersList : undefined,
      user_prompt: context.additional_request || undefined,
    }
  }, [context])

  const fetchDefaultSystemPrompt = useCallback(async () => {
    setLoadingSystemPrompt(true)
    try {
      const response = await fetch(
        `${backendUrl}/api/admin/playground/default-system-prompt`
      )
      if (!response.ok) throw new Error("기본 System Prompt 조회 실패")
      const data = await response.json()
      setSystemPromptOverride(data.system_prompt || "")
      toast.success("프로덕션 기본 System Prompt를 불러왔습니다.")
    } catch (e: any) {
      toast.error(e.message || "불러오기 실패")
    } finally {
      setLoadingSystemPrompt(false)
    }
  }, [backendUrl])

  const fetchPreview = useCallback(async () => {
    if (!context.company_name.trim() || !context.sub_section_title.trim()) {
      toast.error("회사명과 목차명(하위 섹션 제목)을 입력해주세요.")
      return
    }
    setLoadingPreview(true)
    setPreviewPrompt(null)
    try {
      const payload = buildPreviewPayload()
      const response = await fetch(
        `${backendUrl}/api/admin/playground/build-prompt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || "프롬프트 생성 실패")
      }
      const data = await response.json()
      setPreviewPrompt(data.user_prompt || "")
      toast.success("User Prompt 미리보기를 생성했습니다.")
    } catch (e: any) {
      toast.error(e.message || "미리보기 요청 실패")
    } finally {
      setLoadingPreview(false)
    }
  }, [backendUrl, context, buildPreviewPayload])

  const handleRun = useCallback(async () => {
    const finalUserPrompt = useOverride
      ? userPromptOverride.trim()
      : previewPrompt?.trim()
    if (!finalUserPrompt) {
      toast.error(
        useOverride
          ? "User Prompt 오버라이드를 입력하거나, 미리보기를 먼저 생성해주세요."
          : "먼저 'User Prompt 미리보기'를 생성해주세요."
      )
      return
    }
    if (!context.company_name.trim() || !context.sub_section_title.trim()) {
      toast.error("회사명과 목차명을 입력해주세요.")
      return
    }
    setLoadingRun(true)
    setResult(null)
    try {
      const domainList = useCustomDomainFilter && domainFilterText.trim()
        ? domainFilterText
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined

      const payload = {
        ...buildPreviewPayload(),
        user_prompt_override: useOverride ? userPromptOverride.trim() : undefined,
        system_prompt_override: systemPromptOverride.trim()
          ? systemPromptOverride.trim()
          : undefined,
        temperature:
          temperature.trim() !== ""
            ? (() => {
                const v = parseFloat(temperature)
                return Number.isFinite(v) ? v : undefined
              })()
            : undefined,
        search_domain_filter: domainList?.length ? domainList : undefined,
        search_after_date_filter: searchAfterDate.trim() || undefined,
        search_recency_filter: searchRecencyFilter.trim() || undefined,
      }
      const response = await fetch(
        `${backendUrl}/api/admin/playground/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || "실행 실패")
      }
      const data = await response.json()
      setResult({
        user_prompt_sent: data.user_prompt_sent ?? finalUserPrompt,
        system_prompt_sent: data.system_prompt_sent ?? "",
        content: data.content ?? null,
        sources: data.sources ?? null,
        error_message: data.error_message ?? null,
        duration_seconds: data.duration_seconds,
      })
      toast.success("실행이 완료되었습니다.")
    } catch (e: any) {
      toast.error(e.message || "실행 중 오류가 발생했습니다.")
      setResult({
        user_prompt_sent: finalUserPrompt,
        system_prompt_sent: "",
        content: null,
        sources: null,
        error_message: e.message || "Unknown error",
      })
    } finally {
      setLoadingRun(false)
    }
  }, [
    backendUrl,
    buildPreviewPayload,
    useOverride,
    userPromptOverride,
    systemPromptOverride,
    temperature,
    useCustomDomainFilter,
    domainFilterText,
    searchAfterDate,
    searchRecencyFilter,
    previewPrompt,
    context,
  ])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success("클립보드에 복사되었습니다.")
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const displayUserPrompt = useOverride ? userPromptOverride : previewPrompt

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-sm text-muted-foreground flex gap-3">
        <Link href="/admin/generation-logs" className="hover:text-foreground">
          생성 로그
        </Link>
        <Link href="/admin/perplexity-model-comparison" className="hover:text-foreground">
          모델 비교
        </Link>
        <span className="text-foreground font-medium">Playground</span>
      </div>
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold">Context & Prompt Playground</h1>
        <p className="text-muted-foreground">
          프로덕션과 동일한 환경에서 Perplexity User Prompt·Context를 테스트합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 입력 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Context & Prompt
            </CardTitle>
            <CardDescription>
              회사명, 섹션 타입, 목차명(하위 섹션 제목) 등 Context를 입력한 뒤
              User Prompt 미리보기를 생성하고, 필요 시 수정하여 실행할 수
              있습니다.<br/>RAG Context는 적용 X
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>회사명 *</Label>
              <Input
                placeholder="예: LG 헬로비전"
                value={context.company_name}
                onChange={(e) => updateContext("company_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>섹션 타입</Label>
              <Select
                value={context.section_type}
                onValueChange={(v) => updateContext("section_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>목차명 (하위 섹션 제목) *</Label>
              <Input
                placeholder="예: 국내 방송통신 시장 규모 및 최근 3년간 CAGR"
                value={context.sub_section_title}
                onChange={(e) =>
                  updateContext("sub_section_title", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                목차명의 추상화/구체화 수준이 검색 품질에 큰 영향을 줍니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label>업종(카테고리)</Label>
              <Input
                placeholder="예: 방송통신"
                value={context.category}
                onChange={(e) => updateContext("category", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>제품/서비스명</Label>
              <Input
                placeholder="예: 헬로비전 OTT"
                value={context.product_name}
                onChange={(e) => updateContext("product_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>경쟁사 (쉼표 구분)</Label>
              <Input
                placeholder="예: SK B, KT 지니 TV"
                value={context.competitors}
                onChange={(e) => updateContext("competitors", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>타겟 사용자 (쉼표 구분)</Label>
              <Input
                placeholder="예: 30대 남성, OTT 시청자"
                value={context.target_users}
                onChange={(e) =>
                  updateContext("target_users", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>추가 요청사항</Label>
              <Input
                placeholder="추가로 전달할 요청 (선택)"
                value={context.additional_request}
                onChange={(e) =>
                  updateContext("additional_request", e.target.value)
                }
              />
            </div>
            <Separator />

            {/* System Prompt 편집 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>System Prompt</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchDefaultSystemPrompt}
                    disabled={loadingSystemPrompt}
                  >
                    {loadingSystemPrompt ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    프로덕션 기본값 불러오기
                  </Button>
                  {systemPromptOverride && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(systemPromptOverride)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <Textarea
                className="min-h-[180px] font-mono text-sm"
                placeholder="비워두면 프로덕션 기본값이 사용됩니다. '프로덕션 기본값 불러오기' 후 수정하거나 직접 입력하세요."
                value={systemPromptOverride}
                onChange={(e) => setSystemPromptOverride(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                비워두면 get_text_system_prompt() 기본값이 적용됩니다.
              </p>
            </div>

            {/* User Prompt 편집 */}
            <div className="space-y-2">
              <Label>User Prompt</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPreview}
                  disabled={loadingPreview}
                >
                  {loadingPreview ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Context로 미리보기 생성
                </Button>
                {previewPrompt && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseOverride(!useOverride)}
                    >
                      {useOverride ? "미리보기 사용" : "직접 수정"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(displayUserPrompt || "")}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
              {previewPrompt ? (
                useOverride ? (
                  <Textarea
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="User Prompt를 직접 입력하세요."
                    value={userPromptOverride}
                    onChange={(e) => setUserPromptOverride(e.target.value)}
                  />
                ) : (
                  <pre className="p-3 rounded-md bg-muted text-sm overflow-auto max-h-[280px] whitespace-pre-wrap font-mono">
                    {previewPrompt}
                  </pre>
                )
              ) : (
                <Textarea
                  className="min-h-[120px] font-mono text-sm"
                  placeholder="'Context로 미리보기 생성'을 누르면 Context 기반 User Prompt가 채워집니다. 또는 '직접 수정' 후 여기에 직접 입력할 수 있습니다."
                  value={useOverride ? userPromptOverride : ""}
                  onChange={(e) => {
                    setUserPromptOverride(e.target.value)
                    setUseOverride(true)
                  }}
                />
              )}
            </div>

            <Separator />
            <div className="space-y-4">
              <Label className="text-base">실험 옵션</Label>
              <p className="text-xs text-muted-foreground">
                비워두면 프로덕션 기본값이 적용됩니다.
              </p>

              <div className="space-y-2">
                <Label className="text-sm">Temperature</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  placeholder="0.05 (프로덕션 기본값)"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-32"
                />
                <p className="text-xs text-muted-foreground">
                  0~1. 비우면 0.05 적용.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="custom-domain"
                    checked={useCustomDomainFilter}
                    onChange={(e) => setUseCustomDomainFilter(e.target.checked)}
                    className="rounded border-input"
                  />
                  <Label htmlFor="custom-domain" className="text-sm">
                    도메인 필터 커스텀
                  </Label>
                </div>
                {useCustomDomainFilter && (
                  <Textarea
                    className="min-h-[100px] font-mono text-sm"
                    placeholder={"한 줄에 하나씩 또는 쉼표 구분.\n화이트리스트: dart.fss.or.kr\n블랙리스트: -wikipedia.org"}
                    value={domainFilterText}
                    onChange={(e) => setDomainFilterText(e.target.value)}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">검색 시작일 (search_after_date_filter)</Label>
                  <Input
                    type="text"
                    placeholder="MM/DD/YYYY 예: 11/25/2022"
                    value={searchAfterDate}
                    onChange={(e) => setSearchAfterDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">최근성 필터 (search_recency_filter)</Label>
                  <Select
                    value={searchRecencyFilter || "none"}
                    onValueChange={(v) =>
                      setSearchRecencyFilter(v === "none" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">프로덕션 기본값</SelectItem>
                      <SelectItem value="day">day</SelectItem>
                      <SelectItem value="week">week</SelectItem>
                      <SelectItem value="month">month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleRun}
                disabled={loadingRun || !displayUserPrompt}
              >
                {loadingRun ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                실행 (Perplexity 호출)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 오른쪽: 결과 */}
        <Card>
          <CardHeader>
            <CardTitle>실행 결과</CardTitle>
            <CardDescription>
              Perplexity 응답 본문과 검색 출처(sources)를 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                왼쪽에서 Context를 입력하고 &apos;User Prompt 미리보기&apos; 후
                &apos;실행&apos;을 누르면 결과가 여기에 표시됩니다.
              </div>
            ) : (
              <Tabs defaultValue="content">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">본문</TabsTrigger>
                  <TabsTrigger value="sources">출처</TabsTrigger>
                  <TabsTrigger value="prompt">전송된 Prompt</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-4">
                  {result.error_message ? (
                    <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
                      {result.error_message}
                    </div>
                  ) : result.content ? (
                    <div className="space-y-2">
                      {result.duration_seconds != null && (
                        <p className="text-xs text-muted-foreground">
                          소요 시간: {result.duration_seconds.toFixed(2)}초
                        </p>
                      )}
                      <div className="max-h-[500px] overflow-auto rounded-md border p-4 text-sm">
                        <pre className="whitespace-pre-wrap font-sans">
                          {result.content}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">응답 내용 없음</p>
                  )}
                </TabsContent>
                <TabsContent value="sources" className="mt-4">
                  {result.sources && result.sources.length > 0 ? (
                    <ul className="space-y-2 max-h-[500px] overflow-auto">
                      {result.sources.map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm border-b pb-2"
                        >
                          <span className="text-muted-foreground shrink-0">
                            [{i + 1}]
                          </span>
                          <div className="min-w-0">
                            {s.title && (
                              <span className="font-medium">{s.title}</span>
                            )}
                            {s.url && (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary truncate block"
                              >
                                {s.url}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            )}
                            {s.date && (
                              <span className="text-muted-foreground text-xs">
                                {" "}
                                {s.date}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">출처 없음</p>
                  )}
                </TabsContent>
                <TabsContent value="prompt" className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        User Prompt (실제 전송)
                      </Label>
                      <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-auto max-h-[300px] whitespace-pre-wrap font-mono">
                        {result.user_prompt_sent}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          copyToClipboard(result.user_prompt_sent)
                        }
                      >
                        <Copy className="h-4 w-4 mr-1" /> 복사
                      </Button>
                    </div>
                    {result.system_prompt_sent && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          System Prompt (일부)
                        </Label>
                        <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-auto max-h-[200px] whitespace-pre-wrap font-mono">
                          {result.system_prompt_sent.slice(0, 500)}...
                        </pre>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
