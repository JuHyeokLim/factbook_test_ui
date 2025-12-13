"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DetailedInfoStepProps {
  formData: any
  setFormData: (data: any) => void
}

const CATEGORY_OPTIONS = [
  { value: "기초재", label: "기초재", description: "석유, 철강, 화학 원료" },
  { value: "식품", label: "식품", description: "식품 제조, 가공식품" },
  { value: "음료및기호식품", label: "음료 및 기호식품", description: "음료, 주류, 담배" },
  { value: "제약및의료", label: "제약 및 의료", description: "의약품, 의료기기, 병원" },
  { value: "화장품및보건용품", label: "화장품 및 보건용품", description: "화장품, 보건위생용품" },
  { value: "출판", label: "출판", description: "서적, 잡지, 신문" },
  { value: "패션", label: "패션", description: "의류, 신발, 가방, 액세서리" },
  { value: "산업기기", label: "산업기기", description: "산업용 기계, 공구" },
  { value: "정밀기기및사무기기", label: "정밀기기 및 사무기기", description: "계측기, 사무기기" },
  { value: "가정용전기전자", label: "가정용 전기전자", description: "TV, 냉장고, 세탁기" },
  { value: "컴퓨터및정보통신", label: "컴퓨터 및 정보통신", description: "컴퓨터, 스마트폰, 통신" },
  { value: "수송기기", label: "수송기기", description: "자동차, 이륜차" },
  { value: "가정용품", label: "가정용품", description: "가구, 주방용품, 생활용품" },
  { value: "화학공업", label: "화학공업", description: "화학제품, 플라스틱" },
  { value: "건설건재및부동산", label: "건설, 건재 및 부동산", description: "건설, 건축자재, 부동산" },
  { value: "유통", label: "유통", description: "백화점, 마트, 편의점, 이커머스" },
  { value: "금융보험및증권", label: "금융, 보험 및 증권", description: "은행, 보험, 증권, 핀테크" },
  { value: "서비스", label: "서비스", description: "IT서비스, 플랫폼, 소프트웨어" },
  { value: "관공서및단체", label: "관공서 및 단체", description: "정부기관, 공공기관" },
  { value: "교육", label: "교육", description: "교육기관, 교육서비스" },
  { value: "그룹광고", label: "그룹광고", description: "그룹 CI, 통합 광고" },
]

export function DetailedInfoStep({ formData, setFormData }: DetailedInfoStepProps) {
  // 빈 배열일 때도 최소 1개는 표시 (문제 2 해결)
  const displayProposals = formData.proposals.length > 0 ? formData.proposals : [""]
  const displayCompetitors = formData.competitors.length > 0 ? formData.competitors : [""]
  const displayTargets = formData.targetUsers.length > 0 ? formData.targetUsers : [""]

  // 제안 내용 handlers
  const handleAddProposal = () => {
    if (formData.proposals.length < 5) {
      setFormData({
        ...formData,
        proposals: [...formData.proposals, ""],
      })
    }
  }

  const handleRemoveProposal = (idx: number) => {
    setFormData({
      ...formData,
      proposals: formData.proposals.filter((_: string, i: number) => i !== idx),
    })
  }

  const handleUpdateProposal = (idx: number, value: string) => {
    const updated = [...formData.proposals]
    updated[idx] = value
    setFormData({ ...formData, proposals: updated })
  }

  // 경쟁사 handlers
  const handleAddCompetitor = () => {
    if (formData.competitors.length < 5) {
      setFormData({
        ...formData,
        competitors: [...formData.competitors, ""],
      })
    }
  }

  const handleRemoveCompetitor = (idx: number) => {
    setFormData({
      ...formData,
      competitors: formData.competitors.filter((_: string, i: number) => i !== idx),
    })
  }

  const handleUpdateCompetitor = (idx: number, value: string) => {
    const updated = [...formData.competitors]
    updated[idx] = value
    setFormData({ ...formData, competitors: updated })
  }

  // 타겟 사용자 handlers
  const handleAddTarget = () => {
    if (formData.targetUsers.length < 5) {
      setFormData({
        ...formData,
        targetUsers: [...formData.targetUsers, ""],
      })
    }
  }

  const handleRemoveTarget = (idx: number) => {
    setFormData({
      ...formData,
      targetUsers: formData.targetUsers.filter((_: string, i: number) => i !== idx),
    })
  }

  const handleUpdateTarget = (idx: number, value: string) => {
    const updated = [...formData.targetUsers]
    updated[idx] = value
    setFormData({ ...formData, targetUsers: updated })
  }

  return (
    <div className="space-y-6">
      {/* 제목 섹션 */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          추가 정보를 입력하세요.
        </h3>
      </div>

      {/* 업종 카테고리 */}
      <div>
        <label className="block text-sm font-bold mb-2 text-foreground">업종 카테고리</label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="업종 카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 제안 내용 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-foreground">① 고객사 요구 사항</label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 text-primary hover:text-primary"
            onClick={handleAddProposal}
            disabled={formData.proposals.length >= 5}
          >
            <Plus className="w-3 h-3 mr-1" />
            추가
          </Button>
        </div>
        <div className="space-y-2">
          {displayProposals.map((proposal: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Textarea
                placeholder={`요구 사항을 입력하세요.`}
                value={proposal}
                onChange={(e) => handleUpdateProposal(idx, e.target.value)}
                className="flex-1"
              />
              {displayProposals.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveProposal(idx)} 
                  className="flex-shrink-0 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 경쟁사 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-foreground">② 경쟁사</label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 text-primary hover:text-primary"
            onClick={handleAddCompetitor}
            disabled={formData.competitors.length >= 5}
          >
            <Plus className="w-3 h-3 mr-1" />
            추가
          </Button>
        </div>
        <div className="space-y-2">
          {displayCompetitors.map((competitor: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Textarea
                placeholder={`경쟁사를 입력하세요.`}
                value={competitor}
                onChange={(e) => handleUpdateCompetitor(idx, e.target.value)}
                className="flex-1"
              />
              {displayCompetitors.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveCompetitor(idx)} 
                  className="flex-shrink-0 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 타겟 사용자 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-foreground">③ 타겟 사용자</label>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 text-primary hover:text-primary"
            onClick={handleAddTarget}
            disabled={formData.targetUsers.length >= 5}
          >
            <Plus className="w-3 h-3 mr-1" />
            추가
          </Button>
        </div>
        <div className="space-y-2">
          {displayTargets.map((target: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Textarea
                placeholder={`타겟 사용자를 입력하세요.`}
                value={target}
                onChange={(e) => handleUpdateTarget(idx, e.target.value)}
                className="flex-1"
              />
              {displayTargets.length > 1 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveTarget(idx)} 
                  className="flex-shrink-0 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
