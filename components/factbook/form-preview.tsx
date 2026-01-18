"use client"

import { Lock, Building2, Package, Tag, FileText, Users, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FormPreviewProps {
  formData: {
    companyName: string
    productName: string
    category: string
    proposals: string[]
    competitors: string[]
    targetUsers: string[]
  }
}

export function FormPreview({ formData }: FormPreviewProps) {
  const hasData = 
    formData.companyName ||
    formData.productName ||
    formData.category ||
    formData.proposals.some(p => p.trim()) ||
    formData.competitors.some(c => c.trim()) ||
    formData.targetUsers.some(t => t.trim())

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-bold text-lg">입력 정보 미리보기</h3>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            왼쪽에서 정보를 입력하면<br />
            여기에 자동으로 반영됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 기업명 */}
          {formData.companyName && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>기업명</span>
              </div>
              <div className="pl-6">
                <p className="text-lg font-bold text-foreground">{formData.companyName}</p>
              </div>
            </div>
          )}

          {/* 대상 사업/상품 */}
          {formData.productName && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>대상 사업/상품</span>
              </div>
              <div className="pl-6">
                <p className="text-base font-medium text-foreground">{formData.productName}</p>
              </div>
            </div>
          )}

          {/* 업종 카테고리 */}
          {formData.category && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Tag className="w-4 h-4" />
                <span>업종 카테고리</span>
              </div>
              <div className="pl-6">
                <Badge variant="secondary" className="text-sm">
                  {formData.category}
                </Badge>
              </div>
            </div>
          )}

          {/* 고객사 요구 사항 */}
          {formData.proposals.some(p => p.trim()) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>고객사 요구 사항</span>
              </div>
              <div className="pl-6 space-y-2">
                {formData.proposals
                  .filter(p => p.trim())
                  .map((proposal, idx) => (
                    <div key={idx} className="p-3 bg-background border rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-primary mt-0.5">#{idx + 1}</span>
                        <p className="text-sm text-foreground flex-1 whitespace-pre-wrap">
                          {proposal}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 경쟁사 */}
          {formData.competitors.some(c => c.trim()) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>경쟁사</span>
              </div>
              <div className="pl-6">
                <div className="flex flex-wrap gap-2">
                  {formData.competitors
                    .filter(c => c.trim())
                    .map((competitor, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {competitor}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* 타겟 사용자 */}
          {formData.targetUsers.some(t => t.trim()) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Target className="w-4 h-4" />
                <span>타겟 사용자</span>
              </div>
              <div className="pl-6 space-y-2">
                {formData.targetUsers
                  .filter(t => t.trim())
                  .map((target, idx) => (
                    <div key={idx} className="p-3 bg-background border rounded-lg">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{target}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 <span className="font-semibold">팁:</span> RFP를 업로드하면 AI가 자동으로 정보를 추출하여 채워줍니다.
        </p>
      </div>
    </div>
  )
}

