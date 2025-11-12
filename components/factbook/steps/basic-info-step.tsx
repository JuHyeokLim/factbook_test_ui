"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RfpUploadStep } from "./rfp-upload-step"

interface BasicInfoStepProps {
  method: "upload" | "manual"
  setMethod: (method: "upload" | "manual") => void
  formData: any
  setFormData: (data: any) => void
}

export function BasicInfoStep({ method, setMethod, formData, setFormData }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* 제목 섹션 */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          기업명과 대상 사업/상품 정보를 입력하세요.
        </h3>
      </div>

      {/* RFP 업로드 vs 직접 입력 선택 버튼 */}
      <div className="flex gap-3">
        <Button
          variant={method === "upload" ? "default" : "outline"}
          onClick={() => setMethod("upload")}
          className="flex-1 h-11"
        >
          파일 선택
        </Button>
        <Button
          variant={method === "manual" ? "default" : "outline"}
          onClick={() => setMethod("manual")}
          className="flex-1 h-11"
        >
          직접 입력하기
        </Button>
      </div>

      {/* RFP 업로드 모드 */}
      {method === "upload" && (
        <div className="space-y-4">
          <RfpUploadStep />
          <div className="text-xs text-center text-muted-foreground">
            RFP를 여기에 끌어다놓거나
            <br />
            파일 선택 버튼을 눌러주세요.
            <br />
            (10MB 이하의 pdf, pptx, docx, hwp)
          </div>
        </div>
      )}

      {/* 직접 입력 모드 */}
      {method === "manual" && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">기업명</label>
            <Input
              placeholder="기업명을 입력하세요."
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">대상 사업/상품</label>
            <Input
              placeholder="대상 사업 또는 상품을 입력하세요."
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="pt-2">
            <Button 
              variant="link" 
              className="text-sm text-primary p-0 h-auto"
              onClick={() => setMethod("upload")}
            >
              RFP 파일로하기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
