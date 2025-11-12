"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Plus } from "lucide-react"

interface DetailedInfoStepProps {
  formData: any
  setFormData: (data: any) => void
}

export function DetailedInfoStep({ formData, setFormData }: DetailedInfoStepProps) {
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
          상세정보를 입력하세요.
        </h3>
      </div>

      {/* 제안 내용 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-bold text-foreground">① 제안 내용</label>
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
          {formData.proposals.map((proposal: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder={`RFP에서 자동 추출된 제안 내용 ${idx + 1}`}
                value={proposal}
                onChange={(e) => handleUpdateProposal(idx, e.target.value)}
                className="flex-1"
              />
              {formData.proposals.length > 1 && (
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
          {formData.competitors.map((competitor: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder={`AI가 제안하는 경쟁사 ${idx + 1}`}
                value={competitor}
                onChange={(e) => handleUpdateCompetitor(idx, e.target.value)}
                className="flex-1"
              />
              {formData.competitors.length > 1 && (
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
          {formData.targetUsers.map((target: string, idx: number) => (
            <div key={idx} className="flex gap-2">
              <Input
                placeholder={`RFP에서 자동 추출된 타겟 사용자 ${idx + 1}`}
                value={target}
                onChange={(e) => handleUpdateTarget(idx, e.target.value)}
                className="flex-1"
              />
              {formData.targetUsers.length > 1 && (
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
