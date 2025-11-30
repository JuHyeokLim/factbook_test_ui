"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Play, Table, BarChart2, Info, FileText } from "lucide-react"
import { RfpUploadStep } from "@/components/factbook/steps/rfp-upload-step"

// === Pydantic 모델에 해당하는 타입 정의 ===
interface PerplexityTestSection {
  section_type: string
  sub_section_titles: string[]
}

interface PerplexityTestCreateRequest {
  test_name: string
  test_description?: string
  context_source: "rfp" | "factbook" | "manual"
  factbook_id?: number
  rfp_file_path?: string
  manual_context_data?: {
    company_name: string
    product_name?: string
    category?: string
    proposals?: string[]
    competitors?: string[]
    target_users?: string[]
  }
  test_sections: PerplexityTestSection[]
  tested_models: string[]
  test_domain_filter: boolean[]
  test_run_count?: number
  created_by?: string
}

interface PerplexityComparisonTest {
  id: number
  test_name: string
  status: string
  total_test_cases: number
  completed_test_cases: number
  created_at: string
  completed_at: string | null
  context_source: string
  test_sections: PerplexityTestSection[]
  tested_models: string[]
  test_domain_filter: boolean[]
}

interface PerplexityComparisonResult {
  id: number
  model_name: string
  context_size: string | null
  domain_filter_applied: boolean
  section_type: string
  sub_section_title: string | null
  is_section_wide: boolean
  reasoning_effort: string | null
  system_prompt: string
  user_prompt: string
  api_params: any
  input_tokens: number
  output_tokens: number
  citation_tokens: number | null
  reasoning_tokens: number | null
  search_queries: number | null
  input_cost: number
  output_cost: number
  citation_cost: number | null
  reasoning_cost: number | null
  search_queries_cost: number | null
  request_fee: number
  total_cost: number
  duration_seconds: number
  response_content: string | null
  sources: any[] | null
  related_questions: string[] | null
  source_count: number | null
  unique_domain_count: number | null
  domain_diversity_ratio: number | null
  error_message: string | null
  error_type: string | null
  created_at: string
}

const PERPLEXITY_MODELS = [
  "sonar",
  "sonar-pro",
  "sonar-reasoning",
  "sonar-reasoning-pro",
  "sonar-deep-research",
]

const SECTION_TYPE_MAP: { [key: string]: string } = {
  company: "기업 정보",
  market: "시장 현황",
  ownCompany: "자사 분석",
  competitor: "경쟁사 분석",
  target: "타겟 분석",
}

export default function PerplexityModelComparisonPage() {
  const router = useRouter()
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  const [currentStep, setCurrentStep] = useState(0) // 0: 테스트 목록, 1: 컨텍스트 설정, 2: 테스트 설정, 3: 결과 확인
  const [isLoading, setIsLoading] = useState(false)
  const [testId, setTestId] = useState<number | null>(null)
  const [testDetail, setTestDetail] = useState<PerplexityComparisonTest | null>(null)
  const [testResults, setTestResults] = useState<PerplexityComparisonResult[]>([])
  const [allTests, setAllTests] = useState<PerplexityComparisonTest[]>([])
  const [selectedPastTestId, setSelectedPastTestId] = useState<string>("")

  // --- 1단계: 컨텍스트 설정 상태 ---
  const [testName, setTestName] = useState("")
  const [testDescription, setTestDescription] = useState("")
  const [contextSource, setContextSource] = useState<
    "rfp" | "factbook" | "manual"
  >("manual")
  const [selectedFactbookId, setSelectedFactbookId] = useState<string>("")
  const [availableFactbooks, setAvailableFactbooks] = useState<
    { id: number; company_name: string }[]
  >([])
  const [manualContext, setManualContext] = useState({
    company_name: "",
    product_name: "",
    category: "",
    proposals: "",
    competitors: "",
    target_users: "",
  })
  const [rfpExtractedData, setRfpExtractedData] = useState<any>(null)
  const [rfpFile, setRfpFile] = useState<File | null>(null)

  // --- 2단계: 테스트 설정 상태 ---
  const [selectedTestSections, setSelectedTestSections] = useState<
    PerplexityTestSection[]
  >([
    {
      section_type: "market",
      sub_section_titles: [
        "국내 방송통신 시장 규모 및 최근 3년간 연평균 성장률(CAGR) 분석",
        "주요 방송통신 서비스 카테고리별 시장 점유율 현황 분석",
        "디지털 전환, OTT 서비스 확대 등 방송통신 산업 최신 트렌드 분석",
        "방송통신 산업 관련 규제 변화, 소비자 인식 변화 등 시장 성장 기회 및 리스크 요인 분석",
      ],
    },
  ])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [testDomainFilter, setTestDomainFilter] = useState({
    noFilter: false,
    withFilter: false,
  })
  const [testRunCount, setTestRunCount] = useState(1)

  // --- 3단계: 결과 확인 상태 ---
  const [activeResultTab, setActiveResultTab] = useState("summary")
  const [selectedResult, setSelectedResult] =
    useState<PerplexityComparisonResult | null>(null)

  // 팩트북 목록 불러오기
  useEffect(() => {
    async function fetchFactbooks() {
      try {
        const response = await fetch(`${backendUrl}/api/factbooks?limit=100`)
        if (!response.ok) throw new Error("팩트북 목록 로드 실패")
        const data = await response.json()
        setAvailableFactbooks(data.items)
      } catch (error) {
        console.error("Failed to fetch factbooks:", error)
        toast.error("팩트북 목록을 불러오는 데 실패했습니다.")
      }
    }
    fetchFactbooks()
  }, [backendUrl])

  // 과거 테스트 목록 불러오기
  const fetchAllTests = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${backendUrl}/api/admin/perplexity-tests`)
      if (!response.ok) throw new Error("테스트 목록 로드 실패")
      const data = await response.json()
      setAllTests(data.tests || [])
    } catch (error) {
      console.error("Failed to fetch all tests:", error)
      toast.error("과거 테스트 목록을 불러오는 데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [backendUrl])

  useEffect(() => {
    fetchAllTests()
  }, [fetchAllTests])

  // 특정 과거 테스트 결과 불러오기
  const fetchTestResults = useCallback(
    async (id: number) => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `${backendUrl}/api/admin/perplexity-tests/${id}/results`
        )
        if (!response.ok) throw new Error("테스트 결과 로드 실패")
        const data = await response.json()
        setTestDetail(data.test)
        setTestResults(data.results)
        setTestId(id)
        setCurrentStep(3)
        toast.success(`테스트 #${id} 결과를 불러왔습니다.`)
      } catch (error) {
        console.error(`Failed to fetch test results for ${id}:`, error)
        toast.error(`테스트 #${id} 결과를 불러오는 데 실패했습니다.`)
      } finally {
        setIsLoading(false)
      }
    },
    [backendUrl]
  )

  // --- 핸들러 함수 ---
  const handleNextStep = () => setCurrentStep((prev) => prev + 1)
  const handlePrevStep = () => setCurrentStep((prev) => prev - 1)

  const handleRfpFileSelect = useCallback((file: File) => {
    setRfpFile(file)
  }, [])

  const handleRfpExtractedData = useCallback((data: any) => {
    setRfpExtractedData(data)
    setManualContext({
      company_name: data.company_name || "",
      product_name: data.product_name || "",
      category: data.category || "",
      proposals: (data.proposals || []).join(", "),
      competitors: (data.competitors || []).join(", "),
      target_users: (data.target_users || []).join(", "),
    })
  }, [])

  const handleTestRun = async () => {
    if (!testName.trim()) {
      toast.error("테스트 이름을 입력해주세요.")
      return
    }
    if (
      contextSource === "manual" &&
      (!manualContext.company_name.trim() || !manualContext.category.trim())
    ) {
      toast.error("수동 입력 시 회사명과 카테고리는 필수입니다.")
      return
    }
    if (contextSource === "factbook" && !selectedFactbookId) {
      toast.error("기존 팩트북 선택 시 팩트북 ID를 선택해주세요.")
      return
    }
    if (contextSource === "rfp" && (!rfpFile || !rfpExtractedData?.company_name)) {
      toast.error("RFP 파일을 업로드하고 추출을 완료해주세요.")
      return
    }
    if (selectedTestSections.length === 0 || selectedTestSections[0].sub_section_titles.length === 0) {
      toast.error("테스트할 섹션과 하위 항목을 최소 1개 이상 선택해주세요.")
      return
    }
    if (selectedModels.length === 0) {
      toast.error("테스트할 모델을 최소 1개 이상 선택해주세요.")
      return
    }
    if (!testDomainFilter.noFilter && !testDomainFilter.withFilter) {
      toast.error("도메인 필터 적용 여부를 최소 1개 이상 선택해주세요.")
      return
    }

    setIsLoading(true)
    try {
      const requestBody: PerplexityTestCreateRequest = {
        test_name: testName,
        test_description: testDescription,
        context_source: contextSource,
        test_sections: selectedTestSections,
        tested_models: selectedModels,
        test_domain_filter: [], // true: 필터 적용, false: 필터 미적용
        test_run_count: testRunCount,
        created_by: "admin", // 임시 사용자
      }

      if (testDomainFilter.noFilter) requestBody.test_domain_filter.push(false)
      if (testDomainFilter.withFilter) requestBody.test_domain_filter.push(true)

      if (contextSource === "factbook" && selectedFactbookId) {
        requestBody.factbook_id = parseInt(selectedFactbookId)
      } else if (contextSource === "manual") {
        requestBody.manual_context_data = {
          company_name: manualContext.company_name,
          product_name: manualContext.product_name || undefined,
          category: manualContext.category || undefined,
          proposals: manualContext.proposals
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          competitors: manualContext.competitors
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          target_users: manualContext.target_users
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }
      }
      // RFP 파일은 FormData로 직접 전송되므로, 여기서는 requestBody에 추가하지 않음

      // RFP 파일이 있는 경우 FormData로 전송, 그 외에는 JSON으로 전송
      let response: Response
      if (contextSource === "rfp" && rfpFile) {
        // FormData로 파일과 함께 전송
        const formData = new FormData()
        formData.append("rfp_file", rfpFile)  // 백엔드 파라미터 이름과 일치
        formData.append("request_json", JSON.stringify(requestBody))  // 백엔드 파라미터 이름과 일치

        response = await fetch(`${backendUrl}/api/admin/perplexity-tests/run`, {
          method: "POST",
          body: formData,
        })
      } else {
        // JSON으로 전송
        response = await fetch(`${backendUrl}/api/admin/perplexity-tests/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "테스트 실행 실패" }))
        throw new Error(errorData.detail || "테스트 실행에 실패했습니다.")
      }

      const result = await response.json()
      setTestId(result.test_id)
      setCurrentStep(3) // 결과 페이지로 이동
      toast.success(`테스트 #${result.test_id} 가 시작되었습니다!`)
    } catch (error: any) {
      console.error("테스트 실행 실패:", error)
      toast.error(error.message || "테스트 실행 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // --- 결과 요약 계산 ---
  const summaryResults = useMemo(() => {
    const modelSummary: {
      [key: string]: {
        total_cost: number[]
        duration_seconds: number[]
        source_count: number[]
        domain_diversity_ratio: number[]
        count: number
      }
    } = {}

    testResults.forEach((res) => {
      const key = `${res.model_name}-${res.domain_filter_applied ? "withFilter" : "noFilter"}`
      if (!modelSummary[key]) {
        modelSummary[key] = {
          total_cost: [],
          duration_seconds: [],
          source_count: [],
          domain_diversity_ratio: [],
          count: 0,
        }
      }
      if (res.total_cost !== null) modelSummary[key].total_cost.push(res.total_cost)
      if (res.duration_seconds !== null)
        modelSummary[key].duration_seconds.push(res.duration_seconds)
      if (res.source_count !== null) modelSummary[key].source_count.push(res.source_count)
      if (res.domain_diversity_ratio !== null)
        modelSummary[key].domain_diversity_ratio.push(res.domain_diversity_ratio)
      modelSummary[key].count++
    })

    return Object.entries(modelSummary).map(([key, data]) => {
      const [model_name, filter_type] = key.split("-")
      const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0)

      return {
        model_name,
        filter_type: filter_type === "withFilter" ? "필터 적용" : "필터 미적용",
        avg_cost: avg(data.total_cost),
        avg_duration: avg(data.duration_seconds),
        avg_source_count: avg(data.source_count),
        avg_domain_diversity: avg(data.domain_diversity_ratio),
        run_count: data.count,
      }
    })
  }, [testResults])

  const renderCost = (cost: number | null) =>
    cost !== null ? `$${cost.toFixed(4)}` : "-"

  const renderRatio = (ratio: number | null) =>
    ratio !== null ? `${(ratio * 100).toFixed(1)}%` : "-"

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center">
        Perplexity 모델 성능/비용 비교 실험
      </h1>
      <p className="text-center text-muted-foreground text-lg">
        팩트북 생성에 최적의 Perplexity 모델 조합을 찾기 위한 분석 대시보드
      </p>

      {/* --- 단계별 진행 --- */}
      {currentStep > 0 && (
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={currentStep === 0 ? "default" : "outline"}
            onClick={() => {
              setCurrentStep(0)
              setTestId(null)
              setTestDetail(null)
              setTestResults([])
            }}
          >
            테스트 목록
          </Button>
          {[1, 2, 3].map((step) => (
            <Button
              key={step}
              variant={currentStep === step ? "default" : "outline"}
              onClick={() => {
                if (step <= currentStep || testId) {
                  setCurrentStep(step)
                }
              }}
              disabled={step > currentStep && !testId}
            >
              {step}. {step === 1 && "컨텍스트 설정"}
              {step === 2 && "테스트 설정"}
              {step === 3 && "결과 확인"}
            </Button>
          ))}
        </div>
      )}

      {/* --- Step 0: 테스트 목록 (초기 화면) --- */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>과거 테스트 목록</CardTitle>
                <CardDescription>
                  실행된 테스트 목록을 확인하고 결과를 조회할 수 있습니다.
                </CardDescription>
              </div>
              <Button onClick={() => setCurrentStep(1)}>
                <Play className="mr-2 h-4 w-4" />
                새 테스트 실행
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">테스트 목록 로드 중...</span>
              </div>
            ) : allTests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                실행된 테스트가 없습니다.
                <br />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setCurrentStep(1)}
                >
                  새 테스트 실행하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allTests.map((test) => (
                    <Card
                      key={test.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fetchTestResults(test.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{test.test_name}</CardTitle>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              test.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : test.status === "running"
                                ? "bg-blue-100 text-blue-800"
                                : test.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {test.status === "completed"
                              ? "완료"
                              : test.status === "running"
                              ? "실행 중"
                              : test.status === "failed"
                              ? "실패"
                              : "대기"}
                          </span>
                        </div>
                        <CardDescription className="text-xs">
                          ID: {test.id} | {new Date(test.created_at).toLocaleString("ko-KR")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <div>
                          진행률: {test.completed_test_cases}/{test.total_test_cases}
                        </div>
                        <div>
                          모델: {test.tested_models.join(", ").replace(/sonar-/g, "")}
                        </div>
                        <div>
                          컨텍스트: {test.context_source === "rfp" && "RFP 파일"}
                          {test.context_source === "factbook" && "기존 팩트북"}
                          {test.context_source === "manual" && "수동 입력"}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            fetchTestResults(test.id)
                          }}
                        >
                          결과 보기
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" onClick={fetchAllTests} disabled={isLoading}>
                    <Loader2
                      className={isLoading ? "mr-2 h-4 w-4 animate-spin" : "hidden"}
                    />
                    목록 새로고침
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- 1단계: 컨텍스트 설정 --- */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>1. 테스트 컨텍스트 설정</CardTitle>
            <CardDescription>
              테스트에 사용할 회사, 상품, 카테고리 등의 기본 정보를 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="testName">테스트 이름</Label>
            <Input
              id="testName"
              placeholder="예: LG 헬로비전 방송통신 시장 분석"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
            <Label htmlFor="testDescription">테스트 설명 (선택 사항)</Label>
            <Textarea
              id="testDescription"
              placeholder="테스트에 대한 상세 설명을 입력하세요."
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
            />
            <Separator />
            <Label>컨텍스트 소스</Label>
            <Select
              value={contextSource}
              onValueChange={(value: "rfp" | "factbook" | "manual") =>
                setContextSource(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="컨텍스트 소스 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">수동 입력</SelectItem>
                <SelectItem value="rfp">RFP 파일 업로드</SelectItem>
                <SelectItem value="factbook">기존 팩트북 선택</SelectItem>
              </SelectContent>
            </Select>

            {contextSource === "manual" && (
              <div className="space-y-2">
                <Input
                  placeholder="회사명 (필수)"
                  value={manualContext.company_name}
                  onChange={(e) =>
                    setManualContext({ ...manualContext, company_name: e.target.value })
                  }
                />
                <Input
                  placeholder="상품명 (선택)"
                  value={manualContext.product_name}
                  onChange={(e) =>
                    setManualContext({ ...manualContext, product_name: e.target.value })
                  }
                />
                <Input
                  placeholder="카테고리 (필수) 예: 방송통신"
                  value={manualContext.category}
                  onChange={(e) =>
                    setManualContext({ ...manualContext, category: e.target.value })
                  }
                />
                <Textarea
                  placeholder="제안 내용 (쉼표로 구분) 예: 방송통신 시장 분석, 경쟁사 서비스 비교"
                  value={manualContext.proposals}
                  onChange={(e) =>
                    setManualContext({ ...manualContext, proposals: e.target.value })
                  }
                />
                <Textarea
                  placeholder="경쟁사 (쉼표로 구분) 예: SK B, KT 지니 TV"
                  value={manualContext.competitors}
                  onChange={(e) =>
                    setManualContext({ ...manualContext, competitors: e.target.value })
                  }
                />
                <Textarea
                  placeholder="타겟 사용자 (쉼표로 구분) 예: 30대 남성, OTT 시청자"
                  value={manualContext.target_users}
                  onChange={(e) =>
                    setManualContext({ ...manualContext, target_users: e.target.value })
                  }
                />
              </div>
            )}

            {contextSource === "rfp" && (
              <RfpUploadStep 
                onFileSelect={handleRfpFileSelect}
                onExtractedData={handleRfpExtractedData} 
              />
            )}

            {contextSource === "factbook" && (
              <Select
                value={selectedFactbookId}
                onValueChange={setSelectedFactbookId}
                disabled={availableFactbooks.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="기존 팩트북 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableFactbooks.map((fb) => (
                    <SelectItem key={fb.id} value={String(fb.id)}>
                      {fb.company_name} (ID: {fb.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(0)
                setTestId(null)
                setTestDetail(null)
                setTestResults([])
              }}
            >
              테스트 목록으로
            </Button>
            <Button onClick={handleNextStep} disabled={isLoading}>
              다음 단계로
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* --- 2단계: 테스트 설정 --- */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>2. 테스트 설정</CardTitle>
            <CardDescription>
              테스트할 모델, 섹션, 도메인 필터 적용 여부 등을 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>테스트할 섹션 및 하위 항목 (최소 1개)</Label>
              {selectedTestSections.map((section, sIdx) => (
                <Card key={sIdx} className="p-4 bg-muted/20">
                  <Select
                    value={section.section_type}
                    onValueChange={(value) => {
                      const newSections = [...selectedTestSections]
                      newSections[sIdx].section_type = value
                      setSelectedTestSections(newSections)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="섹션 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SECTION_TYPE_MAP).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-4 space-y-2">
                    <Label>하위 항목 목록 (Deep Research는 전체, 일반 모델은 첫 번째만 사용)</Label>
                    <Textarea
                      placeholder="하위 항목을 줄바꿈으로 구분하여 입력하세요. 예: &#10;항목1&#10;항목2"
                      value={section.sub_section_titles.join("\n")}
                      onChange={(e) => {
                        const newSections = [...selectedTestSections]
                        newSections[sIdx].sub_section_titles = e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean)
                        setSelectedTestSections(newSections)
                      }}
                      rows={4}
                    />
                  </div>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setSelectedTestSections([
                    ...selectedTestSections,
                    { section_type: "market", sub_section_titles: [] },
                  ])
                }
              >
                섹션 추가
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>테스트할 모델 (최소 1개)</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERPLEXITY_MODELS.map((model) => (
                  <div key={model} className="flex items-center space-x-2">
                    <Checkbox
                      id={model}
                      checked={selectedModels.includes(model)}
                      onCheckedChange={(checked) => {
                        setSelectedModels((prev) =>
                          checked ? [...prev, model] : prev.filter((m) => m !== model)
                        )
                      }}
                    />
                    <Label htmlFor={model} className="capitalize">
                      {model.replace("sonar-", "")} (
                      {model === "sonar-deep-research" ? "섹션 전체" : "하위 섹션 1개"})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>도메인 필터 적용 여부 (최소 1개)</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noFilter"
                  checked={testDomainFilter.noFilter}
                  onCheckedChange={(checked: boolean) =>
                    setTestDomainFilter((prev) => ({ ...prev, noFilter: checked }))
                  }
                />
                <Label htmlFor="noFilter">도메인 필터 미적용</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="withFilter"
                  checked={testDomainFilter.withFilter}
                  onCheckedChange={(checked: boolean) =>
                    setTestDomainFilter((prev) => ({ ...prev, withFilter: checked }))
                  }
                />
                <Label htmlFor="withFilter">도메인 필터 적용 (20개 한국 도메인)</Label>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="testRunCount">각 테스트 케이스 반복 횟수</Label>
              <Input
                id="testRunCount"
                type="number"
                min="1"
                value={testRunCount}
                onChange={(e) => setTestRunCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="text-sm text-muted-foreground">
                각 모델/필터 조합별로 여러 번 실행하여 평균값을 얻을 수 있습니다. (기본 1회)
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(0)
                  setTestId(null)
                  setTestDetail(null)
                  setTestResults([])
                }}
              >
                테스트 목록으로
              </Button>
              <Button variant="outline" onClick={handlePrevStep} disabled={isLoading}>
                이전 단계
              </Button>
            </div>
            <Button onClick={handleTestRun} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              테스트 실행
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* --- 3단계: 결과 확인 --- */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>3. 테스트 결과 확인</CardTitle>
            <CardDescription>
              Perplexity 모델 비교 테스트 결과를 확인하고 분석합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Select
                  value={selectedPastTestId}
                  onValueChange={(value) => {
                    setSelectedPastTestId(value)
                    if (value) fetchTestResults(parseInt(value))
                  }}
                >
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="다른 테스트 결과 불러오기" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTests.map((test) => (
                      <SelectItem key={test.id} value={String(test.id)}>
                        {test.test_name} (ID: {test.id}) - {test.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={fetchAllTests} disabled={isLoading}>
                  <Loader2
                    className={isLoading ? "mr-2 h-4 w-4 animate-spin" : "hidden"}
                  />
                  목록 새로고침
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(0)
                  setTestId(null)
                  setTestDetail(null)
                  setTestResults([])
                }}
              >
                테스트 목록으로
              </Button>
            </div>
            {testId && testDetail && (
              <Card className="bg-muted/10 p-4">
                <CardTitle className="text-xl">{testDetail.test_name}</CardTitle>
                <CardDescription>
                  상태: {testDetail.status} (
                  {testDetail.completed_test_cases}/{testDetail.total_test_cases} 완료)
                  <br />
                  시작일: {new Date(testDetail.created_at).toLocaleString()}
                  {testDetail.completed_at && (
                    <>
                      <br />완료일: {new Date(testDetail.completed_at).toLocaleString()}
                    </>
                  )}
                </CardDescription>
              </Card>
            )}

            <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">
                  <Table className="mr-2 h-4 w-4" /> 요약
                </TabsTrigger>
                <TabsTrigger value="details">
                  <BarChart2 className="mr-2 h-4 w-4" /> 상세 결과
                </TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="space-y-4">
                <h3 className="text-lg font-semibold">모델별 요약 통계</h3>
                {isLoading && testId ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">결과 로드 중...</span>
                  </div>
                ) : testResults.length === 0 && testId ? (
                    <div className="text-center py-8 text-muted-foreground">
                        테스트 결과가 아직 없습니다. 테스트가 완료될 때까지 기다리세요.
                    </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left text-sm font-semibold">모델</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">필터</th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">
                            평균 총 비용
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">
                            평균 응답 시간(초)
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">
                            평균 출처 개수
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">
                            평균 도메인 다양성
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold">
                            반복 횟수
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {summaryResults.map((summary, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm">
                              {summary.model_name.replace("sonar-", "")}
                            </td>
                            <td className="px-4 py-2 text-sm">{summary.filter_type}</td>
                            <td className="px-4 py-2 text-sm">
                              {renderCost(summary.avg_cost)}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {summary.avg_duration.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {summary.avg_source_count.toFixed(1)}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {renderRatio(summary.avg_domain_diversity)}
                            </td>
                            <td className="px-4 py-2 text-sm">{summary.run_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="details" className="space-y-4">
                <h3 className="text-lg font-semibold">개별 테스트 결과</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testResults.map((result) => (
                    <Card
                      key={result.id}
                      className={`cursor-pointer ${
                        selectedResult?.id === result.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedResult(result)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">
                          {result.model_name.replace("sonar-", "")} (
                          {result.domain_filter_applied ? "필터 적용" : "필터 미적용"})
                        </CardTitle>
                        <CardDescription>
                          {SECTION_TYPE_MAP[result.section_type]} -{" "}
                          {result.sub_section_title || "섹션 전체"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>
                          총 비용:{" "}
                          <span className="font-semibold">
                            {renderCost(result.total_cost)}
                          </span>
                        </p>
                        <p>
                          응답 시간:{" "}
                          <span className="font-semibold">
                            {result.duration_seconds?.toFixed(2) || "-"}초
                          </span>
                        </p>
                        {result.error_message && (
                          <p className="text-destructive">에러: {result.error_message}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 상세 결과 모달 */}
                {selectedResult && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-[90vw] max-w-4xl max-h-[90vh] flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>테스트 결과 상세</CardTitle>
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedResult(null)}
                          className="px-2"
                        >
                          X
                        </Button>
                      </CardHeader>
                      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">개요</TabsTrigger>
                          <TabsTrigger value="prompts">프롬프트</TabsTrigger>
                          <TabsTrigger value="response">응답</TabsTrigger>
                          <TabsTrigger value="costs">비용</TabsTrigger>
                        </TabsList>
                        <div className="flex-1 overflow-y-auto p-4">
                          <TabsContent value="overview" className="space-y-2 text-sm">
                            <p>
                              <strong>모델:</strong> {selectedResult.model_name}
                            </p>
                            <p>
                              <strong>컨텍스트 사이즈:</strong>{" "}
                              {selectedResult.context_size || "-"}
                            </p>
                            <p>
                              <strong>도메인 필터:</strong>{" "}
                              {selectedResult.domain_filter_applied ? "적용" : "미적용"}
                            </p>
                            <p>
                              <strong>섹션 타입:</strong>{" "}
                              {SECTION_TYPE_MAP[selectedResult.section_type]}
                            </p>
                            <p>
                              <strong>하위 섹션 제목:</strong>{" "}
                              {selectedResult.sub_section_title || "-"}
                            </p>
                            <p>
                              <strong>처리 단위:</strong>{" "}
                              {selectedResult.is_section_wide ? "섹션 전체" : "하위 섹션 1개"}
                            </p>
                            {selectedResult.reasoning_effort && (
                              <p>
                                <strong>추론 노력:</strong> {selectedResult.reasoning_effort}
                              </p>
                            )}
                            <p>
                              <strong>응답 시간:</strong>{" "}
                              {selectedResult.duration_seconds?.toFixed(3) || "-"}초
                            </p>
                            <p>
                              <strong>출처 개수:</strong> {selectedResult.source_count || "-"}
                            </p>
                            <p>
                              <strong>고유 도메인 수:</strong>{" "}
                              {selectedResult.unique_domain_count || "-"}
                            </p>
                            <p>
                              <strong>도메인 다양성:</strong>{" "}
                              {renderRatio(selectedResult.domain_diversity_ratio)}
                            </p>
                            <p>
                              <strong>생성일:</strong>{" "}
                              {new Date(selectedResult.created_at).toLocaleString()}
                            </p>
                          </TabsContent>
                          <TabsContent value="prompts" className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">시스템 프롬프트</h4>
                              <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap">
                                {selectedResult.system_prompt}
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">사용자 프롬프트</h4>
                              <pre className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap">
                                {selectedResult.user_prompt}
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">API 파라미터</h4>
                              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                {JSON.stringify(selectedResult.api_params, null, 2)}
                              </pre>
                            </div>
                          </TabsContent>
                          <TabsContent value="response" className="space-y-4">
                            {selectedResult.error_message ? (
                              <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm text-destructive">
                                <p className="font-semibold mb-2">
                                  에러 발생: {selectedResult.error_type}
                                </p>
                                <pre className="whitespace-pre-wrap">
                                  {selectedResult.error_message}
                                </pre>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <h4 className="font-semibold mb-2">생성된 내용</h4>
                                  <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{
                                      __html: selectedResult.response_content || "",
                                    }}
                                  />
                                </div>
                                {selectedResult.sources &&
                                  selectedResult.sources.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">출처</h4>
                                      <ul className="list-disc pl-5 text-sm">
                                        {selectedResult.sources.map((source, idx) => (
                                          <li key={idx}>
                                            <a
                                              href={source.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              {source.title || source.url} ({source.domain})
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                {selectedResult.related_questions &&
                                  selectedResult.related_questions.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2">관련 질문</h4>
                                      <ul className="list-disc pl-5 text-sm">
                                        {selectedResult.related_questions.map((q, idx) => (
                                          <li key={idx}>{q}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                              </>
                            )}
                          </TabsContent>
                          <TabsContent value="costs" className="space-y-2 text-sm">
                            <p>
                              <strong>Input Tokens:</strong> {selectedResult.input_tokens || 0}{" "}
                              ({renderCost(selectedResult.input_cost)})
                            </p>
                            <p>
                              <strong>Output Tokens:</strong>{" "}
                              {selectedResult.output_tokens || 0} (
                              {renderCost(selectedResult.output_cost)})
                            </p>
                            {selectedResult.citation_tokens !== null && (
                              <p>
                                <strong>Citation Tokens:</strong>{" "}
                                {selectedResult.citation_tokens || 0} (
                                {renderCost(selectedResult.citation_cost)})
                              </p>
                            )}
                            {selectedResult.reasoning_tokens !== null && (
                              <p>
                                <strong>Reasoning Tokens:</strong>{" "}
                                {selectedResult.reasoning_tokens || 0} (
                                {renderCost(selectedResult.reasoning_cost)})
                              </p>
                            )}
                            {selectedResult.search_queries !== null && (
                              <p>
                                <strong>Search Queries:</strong>{" "}
                                {selectedResult.search_queries || 0} (
                                {renderCost(selectedResult.search_queries_cost)})
                              </p>
                            )}
                            <p>
                              <strong>Request Fee:</strong>{" "}
                              {renderCost(selectedResult.request_fee)}
                            </p>
                            <Separator className="my-2" />
                            <p className="text-lg font-bold">
                              총 비용: {renderCost(selectedResult.total_cost)}
                            </p>
                          </TabsContent>
                        </div>
                      </Tabs>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(0)
                setTestId(null)
                setTestDetail(null)
                setTestResults([])
              }}
            >
              테스트 목록으로
            </Button>
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep} disabled={isLoading}>
                이전 단계
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
