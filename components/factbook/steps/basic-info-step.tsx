"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RfpUploadStep } from "./rfp-upload-step"
import { CompanySearchInput } from "../company-search-input"

interface BasicInfoStepProps {
  method: "upload" | "manual"
  setMethod: (method: "upload" | "manual") => void
  formData: any
  setFormData: (data: any) => void
}

export function BasicInfoStep({ method, setMethod, formData, setFormData }: BasicInfoStepProps) {
  return (
    <div className="space-y-8 min-h-[400px] py-4">
      {/* 제목 섹션 */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
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
        <div className="space-y-6 py-4">
          <RfpUploadStep
            onExtractedData={(data) => {
              // 추출된 데이터로 폼 자동 채우기
              if (data) {
                setFormData({
                  ...formData,
                  companyName: data.company_name || formData.companyName,
                  productName: data.product_name || formData.productName,
                  category: data.category || formData.category,  // 카테고리 자동 설정
                  // 배열이 비어있지 않으면 사용, 비어있으면 기존 값 유지
                  proposals: data.proposals && data.proposals.length > 0 ? data.proposals : formData.proposals,
                  competitors: data.competitors && data.competitors.length > 0 ? data.competitors : formData.competitors,
                  targetUsers: data.target_users && data.target_users.length > 0 ? data.target_users : formData.targetUsers,
                  // 문제 3 해결: 메뉴 항목 추천을 기존 값과 병합
                  menuItems: data.menu_recommendations 
                    ? { ...formData.menuItems, ...data.menu_recommendations }
                    : formData.menuItems,
                  // 매체 소재 분석 요구사항이 있으면 On으로 설정
                  analysisItems: {
                    ...formData.analysisItems,
                    media: data.requires_media_analysis ?? formData.analysisItems?.media ?? false,
                  },
                })
                // RFP 업로드 완료 시 직접 입력 탭으로 이동
                setMethod("manual")
              }
            }}
          />
        </div>
      )}

      {/* 직접 입력 모드 */}
      {method === "manual" && (
        <div className="space-y-8 py-4">
          <CompanySearchInput
            value={formData.companyName}
            onChange={(value) => setFormData({ ...formData, companyName: value })}
            placeholder="기업명을 입력하세요"
          />

          <div>
            <label className="block text-sm font-bold mb-2 text-foreground">대상 사업/상품</label>
            <Input
              placeholder="대상 사업 또는 상품을 입력하세요."
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="h-11"
            />
          </div>
        </div>
      )}
    </div>
  )
}
