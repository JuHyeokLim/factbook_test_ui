"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BasicInfoStep } from "./steps/basic-info-step"
import { DetailedInfoStep } from "./steps/detailed-info-step"
import { MenuConfigStep } from "./steps/menu-config-step"

interface CreateFactbookModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateSuccess: () => void
}

export function CreateFactbookModal({ open, onOpenChange, onCreateSuccess }: CreateFactbookModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [method, setMethod] = useState<"upload" | "manual">("upload")
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    menuItems: {},
    companyInfoItems: {
      basic: true, // 고정
      philosophy: true, // 고정
      history: true, // 고정
      business: false, // On/Off 가능
      finance: false, // On/Off 가능
    },
  })

  const steps = [
    { title: "기본정보 입력", value: "basic" },
    { title: "추가정보 입력", value: "additional" },
    { title: "메뉴 구성", value: "menu" },
  ]

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

  const handleCreateFactbook = async () => {
    setIsSubmitting(true)
    
    try {
      // 빈 문자열 제거
      const cleanedProposals = formData.proposals.filter((p: string) => p.trim())
      const cleanedCompetitors = formData.competitors.filter((c: string) => c.trim())
      const cleanedTargetUsers = formData.targetUsers.filter((t: string) => t.trim())
      
      // 메뉴 항목 정리 (빈 문자열 제거)
      const cleanedMenuItems: Record<string, string[]> = {}
      Object.entries(formData.menuItems).forEach(([key, items]) => {
        cleanedMenuItems[key] = (items as string[]).filter(item => item.trim())
      })
      
      const requestBody = {
        company_name: formData.companyName,
        product_name: formData.productName || null,
        category: formData.category || null,
        proposals: cleanedProposals,
        competitors: cleanedCompetitors,
        target_users: cleanedTargetUsers,
        menu_items: cleanedMenuItems,
        analysis_items: formData.analysisItems,
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
        menuItems: {},
        companyInfoItems: {
          basic: true,
          philosophy: true,
          history: true,
          business: false,
          finance: false,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${currentStep === 2 ? "!max-w-[95vw] !w-[95vw] sm:!max-w-[95vw]" : "max-w-2xl"} max-h-[90vh] overflow-y-auto p-6`}>
        <DialogHeader>
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

        <div className="mt-6 space-y-6">
          {currentStep === 0 && (
            <BasicInfoStep
              method={method}
              setMethod={setMethod}
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {currentStep === 1 && (
            <DetailedInfoStep formData={formData} setFormData={setFormData} />
          )}

          {currentStep === 2 && <MenuConfigStep formData={formData} setFormData={setFormData} />}

          {/* Navigation */}
          <div className="flex justify-between gap-3 pt-6 border-t border-border">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0 || isSubmitting}
              className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted rounded-md transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "생성 중..." : (currentStep === steps.length - 1 ? "완료" : "다음")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
