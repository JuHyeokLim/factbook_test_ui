"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Check, BookOpen } from "lucide-react"
import { UnifiedInfoStep } from "@/components/factbook/steps/unified-info-step"
import { MenuConfigStep } from "@/components/factbook/steps/menu-config-step"

const DEFAULT_MENU_ITEMS: Record<string, string[]> = {
  company: [
    "기본 정보 (기업명, 대표자, 설립일, 업종, 주소, 홈페이지)",
    "철학 및 비전 (비전과 목표, CEO 메시지, 브랜드 보이스 등)",
    "역사 (설립 배경, 주요 연혁 등)",
    "주요 사업 (사업 분야, 상품/서비스, 수익모델 등)",
    "재무 정보 (최근 3년 매출, 영업이익, 투자 및 비용 구조 등)",
  ],
  market: [],
  ownCompany: [],
  competitor: [],
  target: [],
}

const getDefaultMenuItems = () =>
  Object.fromEntries(Object.entries(DEFAULT_MENU_ITEMS).map(([key, items]) => [key, [...items]]))

export default function CreateFactbookPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [method, setMethod] = useState<"upload" | "manual">("upload")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRfpProcessing, setIsRfpProcessing] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    companyName: "",
    category: "",
    items: [
      { id: "1", productName: "", competitors: [], proposals: [], targetCustomers: [] }
    ],
    analysisItems: {
      media: false,
    },
    menuItems: getDefaultMenuItems(),
    companyInfoItems: {
      basic: true,
      philosophy: true,
      history: true,
      business: true,
      finance: true,
    },
    referenceMaterials: [],
  })

  const steps = [
    { title: "주요 정보 입력", value: "info" },
    { title: "목차 구성", value: "menu" },
  ]

  // Step 2로 이동할 때 스크롤을 최상단으로 이동
  useEffect(() => {
    if (currentStep === 1 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [currentStep])

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0)
    } else {
      if (hasUnsavedChanges()) {
        if (confirm("작성 중인 내용이 있습니다. 정말 나가시겠습니까?")) {
          router.push("/")
        }
      } else {
        router.push("/")
      }
    }
  }

  const hasUnsavedChanges = (): boolean => {
    return (
      formData.companyName.trim() !== "" ||
      formData.category !== "" ||
      formData.items.some((item: any) => 
        item.productName.trim() !== "" || 
        item.competitors.length > 0 || 
        item.proposals.length > 0 || 
        item.targetCustomers.length > 0
      )
    )
  }

  const isStepValid = (step: number): boolean => {
    if (step === 0) {
      // 주요 정보 입력: 기업명과 첫 번째 상품명은 필수
      return formData.companyName.trim() !== "" && formData.items[0]?.productName.trim() !== ""
    }
    if (step === 1) {
      // 목차 구성: 항상 유효
      return true
    }
    return true
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      await handleCreateFactbook()
    }
  }

  const handleCreateFactbook = async () => {
    setIsSubmitting(true)
    
    try {
      // 항목 정리 (빈 제품명 제외)
      const cleanedItems = formData.items
        .filter((item: any) => item.productName && item.productName.trim())
        .map((item: any) => ({
          id: item.id,
          product_name: item.productName.trim(),
          competitors: item.competitors.filter((c: string) => c && c.trim()),
          proposals: item.proposals.filter((p: string) => p && p.trim()),
          target_customers: item.targetCustomers.filter((t: string) => t && t.trim())
        }))

      // 메뉴 항목 정리
      const cleanedMenuItems: Record<string, string[]> = {}
      Object.entries(formData.menuItems || {}).forEach(([key, items]) => {
        cleanedMenuItems[key] = (items as string[]).map(item => item.trim()).filter(Boolean)
      })

      // 참고 자료 정리
      const referenceMaterials = (formData.referenceMaterials || []).map((m: any) => ({
        type: m.type,
        name: m.name || (m.type === "link" ? m.url : "참고자료"),
        url: m.url || "",
        s3_key: m.s3_key || "",
        content: m.content || "",
        file_size: m.file_size || 0,
        content_type: m.content_type || ""
      }))

      const requestBody = {
        company_name: formData.companyName,
        category: formData.category || "기타",
        items: cleanedItems,
        menu_items: cleanedMenuItems,
        analysis_items: formData.analysisItems,
        reference_materials: referenceMaterials,
        // 하위 호환을 위한 더미 데이터 -> 모든 제품명을 쉼표로 연결하여 저장
        product_name: cleanedItems.map(item => item.product_name).join(", "),
        proposals: [],
        competitors: [],
        target_users: [],
      }
      
      console.log("팩트북 생성 요청:", requestBody)
      
      // 백엔드 API 호출
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const response = await fetch(`${backendUrl}/api/factbooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "생성 실패" }))
        throw new Error(errorData.detail || "팩트북 생성에 실패했습니다.")
      }
      
      const result = await response.json()
      console.log("팩트북 생성 시작:", result)
      
      // 홈으로 이동
      router.push("/")
      
    } catch (error) {
      console.error("팩트북 생성 실패:", error)
      alert(error instanceof Error ? error.message : "팩트북 생성에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 고도화된 GNB */}
      <header className="border-b bg-white sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1400px] mx-auto px-10 h-16 flex items-center relative">
          {/* 좌측 영역: 서비스 명 및 나가기 */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={isRfpProcessing}
              className="text-slate-800 hover:text-slate-900 hover:bg-slate-100 -ml-2 h-9 px-3 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-[13px] font-bold">{currentStep === 1 ? "이전" : "나가기"}</span>
            </Button>
            <div className="h-4 w-px bg-slate-200" />
          </div>

          {/* 중앙 영역: 현대적인 스테프 인디케이터 */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <nav className="flex items-center gap-6">
              {steps.map((step, idx) => (
                <div 
                  key={step.value}
                  className="flex items-center gap-3"
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold transition-all duration-300 ${
                    idx === currentStep 
                      ? "bg-primary text-white shadow-sm ring-4 ring-primary/10" 
                      : idx < currentStep 
                        ? "bg-emerald-500 text-white" 
                        : "bg-slate-100 text-slate-400"
                  }`}>
                    {idx < currentStep ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[13px] font-bold tracking-tight transition-colors duration-300 ${
                    idx === currentStep ? "text-slate-900" : "text-slate-400"
                  }`}>
                    {step.title}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className="w-10 h-px bg-slate-200 ml-2" />
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* 우측 영역: 액션 버튼 */}
          <div className="ml-auto flex items-center gap-4">
            <Button
              onClick={handleNext}
              disabled={isSubmitting || isRfpProcessing || !isStepValid(currentStep)}
              size="sm"
              className="rounded-xl px-6 shadow-sm h-10 font-bold transition-all active:scale-95 hover:shadow-md"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">생성 중...</span>
              ) : currentStep === steps.length - 1 ? (
                <span className="flex items-center gap-1.5">팩트북 만들기 <Check className="w-3.5 h-3.5" /></span>
              ) : (
                <span className="flex items-center gap-1.5">다음 단계 <ArrowRight className="w-3.5 h-3.5" /></span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-10 py-6 min-h-[calc(100vh-64px)]">
          {currentStep === 0 ? (
            <div className="h-full">
              <UnifiedInfoStep
                method={method}
                setMethod={setMethod}
                formData={formData}
                setFormData={setFormData}
                onRfpProcessing={setIsRfpProcessing}
              />
            </div>
          ) : (
            <div ref={scrollContainerRef} className="h-full bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[600px]">
              <MenuConfigStep formData={formData} setFormData={setFormData} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

