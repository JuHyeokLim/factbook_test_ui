"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UnifiedInfoStep } from "./steps/unified-info-step"
import { MenuConfigStep } from "./steps/menu-config-step"

const DEFAULT_MENU_ITEMS: Record<string, string[]> = {
  company: [
    "기본 정보 (회사 로고, 회사 이름, 대표자, 주소, 홈페이지, 업종, 설립일)",
    "철학 및 비전 (비전과 목표, CEO 메시지, 브랜드 보이스)",
    "역사 (설립 배경, 주요 연혁)",
    "주요 사업 (사업 분야, 상품/서비스, 수익모델)",
    "재무 정보 (최근 3년 매출, 영업이익, 투자 및 비용 구조)",
  ],
  market: [
    "국내 광고/마케팅 시장의 최근 3년간 규모 및 연평균 성장률 분석",
    "디지털 광고 시장의 메타, 구글, 유튜브 등 주요 플랫폼별 트렌드 및 성장 전망 분석",
    "광고/마케팅 서비스의 AI 기술 도입, 크리에이티브 자동화, 데이터 기반 마케팅 등 최신 산업 트렌드 분석",
  ],
  ownCompany: [
    "대홍기획의 광고/마케팅 서비스별 핵심 USP 및 세부 역량 분석",
    "대홍기획 주력 서비스의 출시 배경, 주요 업데이트 및 클라이언트 유치 캠페인 변화 과정 분석",
  ],
  competitor: [
    "대홍기획의 주요 경쟁사(제일기획, 이노션, HSAD) 비교 (시장 점유율, 주요 클라이언트, 서비스 역량 등)",
    "경쟁사(제일기획, 이노션, HSAD) 대비 대홍기획의 차별화 포인트 및 경쟁 우위 요소 도출",
  ],
  target: [
    "광고/마케팅 서비스 클라이언트의 관심사, 가치관, 라이프스타일, 미디어 소비 패턴 등 심리/행동적 특성 분석",
    "광고/마케팅 서비스에 대한 클라이언트의 미충족 니즈, 구매 고려 요인, 선호도 분석",
  ],
}

const getDefaultMenuItems = () =>
  Object.fromEntries(Object.entries(DEFAULT_MENU_ITEMS).map(([key, items]) => [key, [...items]]))

interface CreateFactbookModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSuccess: () => void
}

export function CreateFactbookModal({ open, onOpenChange, onCreateSuccess }: CreateFactbookModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [method, setMethod] = useState<"upload" | "manual">("upload")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    companyName: "",
    productName: "",
    category: "",  // 업종 카테고리 (21개 중 하나)
    proposals: [""],
    competitors: [""],
    targetUsers: [""],
    analysisItems: {
      media: false,
    },
    menuItems: getDefaultMenuItems(),
    companyInfoItems: {
      basic: true,
      philosophy: true,
      history: true,
      business: true, // 기본값으로 설정
      finance: true, // 기본값으로 설정
    },
  })

  const steps = [
    { title: "주요 정보 입력", value: "info" },
    { title: "목차 구성", value: "menu" },
  ]

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (open) {
      setCurrentStep(0)
      setMethod("upload")
      setFormData({
        companyName: "",
        productName: "",
        category: "",
        proposals: [""],
        competitors: [""],
        targetUsers: [""],
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
      })
    }
  }, [open])

  // Step 2로 이동할 때 스크롤을 최상단으로 이동
  useEffect(() => {
    if (currentStep === 1 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }, [currentStep])

  // 작성 중인 내용이 있는지 확인
  const hasUnsavedChanges = (): boolean => {
    return (
      formData.companyName.trim() !== "" ||
      formData.productName.trim() !== "" ||
      formData.category !== "" ||
      formData.proposals.some((p: string) => p.trim() !== "") ||
      formData.competitors.some((c: string) => c.trim() !== "") ||
      formData.targetUsers.some((t: string) => t.trim() !== "") ||
      currentStep > 0
    )
  }

  // 모달 닫기 핸들러 (확인 다이얼로그 포함)
  const handleModalClose = (newOpen: boolean) => {
    if (!newOpen && hasUnsavedChanges() && !isSubmitting) {
      // 작성 중인 내용이 있으면 확인
      if (confirm("작성 중인 내용이 있습니다. 정말 닫으시겠습니까?")) {
        onOpenChange(false)
      }
    } else {
      onOpenChange(newOpen)
    }
  }

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Step3 완료 - 팩트북 생성 API 호출
      await handleCreateFactbook()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number): boolean => {
    if (step === 0) {
      // 주요 정보 입력: 기업명은 필수
      return formData.companyName.trim() !== ""
    }
    if (step === 1) {
      // 목차 구성: 항상 유효
      return true
    }
    return true
  }

  const handleCreateFactbook = async () => {
    setIsSubmitting(true)
    
    try {
      // 빈 문자열 제거
      const cleanedProposals = formData.proposals.filter((p: string) => p.trim())
      const cleanedCompetitors = formData.competitors.filter((c: string) => c.trim())
      const cleanedTargetUsers = formData.targetUsers.filter((t: string) => t.trim())
      
      // 메뉴 항목 정리 (빈 문자열 제거 + 기업 정보 토글 필터링)
      const cleanedMenuItems: Record<string, string[]> = {}
      
      // company 섹션은 항상 보장 (다른 섹션보다 먼저 처리)
      // const companyItems = formData.menuItems?.company || DEFAULT_MENU_ITEMS.company
      // const companyInfoState = formData.companyInfoItems || {}
      // cleanedMenuItems.company = companyItems
      //   .filter((_, idx) => {
      //     if (idx < 3) return true // 기본 3개는 항상 포함
      //     if (idx === 3) return !!companyInfoState.business
      //     if (idx === 4) return !!companyInfoState.finance
      //     return true
      //   })
      //   .map(item => item.trim())
      //   .filter(Boolean)
      
      // 나머지 섹션 처리
      // Object.entries(formData.menuItems || {}).forEach(([key, items]) => {
      //   if (key !== "company") { // company는 이미 처리했으므로 제외
      //     cleanedMenuItems[key] = (items as string[]).map(item => item.trim()).filter(Boolean)
      //   }
      // })
      
      // 모든 섹션 처리
      Object.entries(formData.menuItems || {}).forEach(([key, items]) => {
        cleanedMenuItems[key] = (items as string[]).map(item => item.trim()).filter(Boolean)
      })

      const requestBody = {
        company_name: formData.companyName,
        product_name: formData.productName || null,
        category: formData.category || "기타",
        proposals: cleanedProposals,
        competitors: cleanedCompetitors,
        target_users: cleanedTargetUsers,
        menu_items: cleanedMenuItems,
        analysis_items: formData.analysisItems,
      }
      
      console.log("팩트북 생성 요청:", requestBody)
      console.log("company 섹션:", cleanedMenuItems.company)
      
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
      
      // 모달 닫기 및 성공 콜백 호출
      onOpenChange(false)
      onCreateSuccess()
      
      // 폼 초기화
      setFormData({
        companyName: "",
        productName: "",
        category: "",
        proposals: [""],
        competitors: [""],
        targetUsers: [""],
        analysisItems: {
          media: false,
        },
        menuItems: getDefaultMenuItems(),
        companyInfoItems: {
          basic: true,
          philosophy: true,
          history: true,
          business: true, // 기본값으로 설정
          finance: true, // 기본값으로 설정
        },
      })
      setCurrentStep(0)
      
    } catch (error) {
      console.error("팩트북 생성 실패:", error)
      alert(error instanceof Error ? error.message : "팩트북 생성에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className={`${currentStep === 1 ? "!max-w-[95vw] !w-[95vw] sm:!max-w-[95vw]" : "max-w-2xl"} max-h-[90vh] flex flex-col p-6`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>팩트북 만들기</DialogTitle>
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4 text-sm">
            {steps.map((step, idx) => (
              <div key={step.value} className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    idx <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                {idx < steps.length - 1 && (
                  <div className={`w-8 h-1 ${idx < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div ref={scrollContainerRef} className="mt-6 flex-1 overflow-y-auto">
          {currentStep === 0 && (
            <UnifiedInfoStep
              method={method}
              setMethod={setMethod}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {currentStep === 1 && <MenuConfigStep formData={formData} setFormData={setFormData} />}
        </div>

        {/* Navigation - Fixed at bottom */}
        <div className={`flex gap-3 pt-6 border-t border-border mt-6 flex-shrink-0 ${currentStep === 0 ? "justify-end" : "justify-between"}`}>
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted rounded-md transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isSubmitting || !isStepValid(currentStep)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "생성 중..." : (currentStep === steps.length - 1 ? "완료" : "다음")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
