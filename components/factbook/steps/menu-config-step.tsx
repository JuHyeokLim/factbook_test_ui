"use client"

import { Switch } from "@/components/ui/switch"

interface MenuConfigStepProps {
  formData: any
  setFormData?: (data: any) => void
}

interface AnalysisItem {
  id: string
  title: string
  description: string
  hasInput: boolean
  hasToggle: boolean
}

const ANALYSIS_ITEMS: AnalysisItem[] = [
  {
    id: "company",
    title: "기업 분석",
    description: "제품정보, 주요 사업 구조, 경영 변화, 브랜드 비전과 철학을 정리합니다.",
    hasInput: false,
    hasToggle: false,
  },
  {
    id: "market",
    title: "시장 분석",
    description: "규모와 성장률, 주요 기업 점유율, 산업 트렌드, 성장 보고와 리스크를 정리합니다.",
    hasInput: true,
    hasToggle: false,
  },
  {
    id: "ownCompany",
    title: "자사 분석",
    description: "주요 제품 서비스, 주력 상품, 변화 마케, 소비자 인식과 브랜드 이미지를 정리합니다.",
    hasInput: true,
    hasToggle: false,
  },
  {
    id: "competitor",
    title: "경쟁사 분석",
    description: "직접 경쟁 브랜드의 제품, 가격, 포지셔닝, 소비자 인식, 광고 전략 차이를 비교 정리합니다.",
    hasInput: true,
    hasToggle: false,
  },
  {
    id: "target",
    title: "타겟 분석",
    description: "주요 소비자층의 연령, 성별, 지역, 관심사, 가치관, 신년 미디어 채택을 분석합니다.",
    hasInput: true,
    hasToggle: false,
  },
  {
    id: "media",
    title: "매체 소재 분석 (DA)",
    description: "자사 및 경쟁사 매체별 소재를 수집합니다.\n(예외: 메타, 인스타그램, 구글, Youtube)",
    hasInput: false,
    hasToggle: true,
  },
]

export function MenuConfigStep({ formData, setFormData }: MenuConfigStepProps) {
  const handleToggle = (id: string, checked: boolean) => {
    if (setFormData) {
      setFormData({
        ...formData,
        analysisItems: {
          ...formData.analysisItems,
          [id]: checked,
        },
      })
    }
  }

  const handlePromptChange = (id: string, value: string) => {
    if (setFormData) {
      setFormData({
        ...formData,
        analysisPrompts: {
          ...formData.analysisPrompts,
          [id]: value,
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 제목 섹션 */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          구성 정보를 설정하세요.
        </h3>
      </div>

      {/* 분석 항목 리스트 */}
      <div className="space-y-3">
        {ANALYSIS_ITEMS.map((item, idx) => (
          <div key={item.id} className="px-5 pt-5 pb-3 bg-muted/30 rounded-lg border border-border">
            {/* 번호와 목차명 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {idx + 1}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{item.title}</span>
                {item.hasToggle && (
                  <Switch
                    id={item.id}
                    checked={formData.analysisItems?.[item.id] ?? true}
                    onCheckedChange={(checked) => handleToggle(item.id, checked)}
                  />
                )}
              </div>
            </div>

            {/* 입력폼 (3줄) - 시장/자사/경쟁사/타겟 분석만 */}
            {item.hasInput && (
              <textarea
                id={item.id}
                value={formData.analysisPrompts?.[item.id] || item.description}
                onChange={(e) => handlePromptChange(item.id, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            )}

            {/* 설명만 표시 - 기업 분석 */}
            {!item.hasInput && !item.hasToggle && (
              <div className="ml-9">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            )}

            {/* 설명 표시 - 매체 소재 분석 */}
            {item.hasToggle && (
              <div className="ml-9">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
