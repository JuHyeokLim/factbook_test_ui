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
  const [formData, setFormData] = useState({
    companyName: "",
    productName: "",
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onCreateSuccess()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
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
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted rounded-md transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              {currentStep === steps.length - 1 ? "완료" : "다음"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
