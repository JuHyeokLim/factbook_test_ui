"use client"

import { useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"

interface MenuConfigStepProps {
  formData: any
  setFormData?: (data: any) => void
}

interface MenuItem {
  id: string
  title: string
  isFixed: boolean
  defaultItems: string[]
}

interface CompanyInfoItem {
  id: string
  title: string
  description: string
  items: string[]
  isFixed: boolean
}

const COMPANY_INFO_ITEMS: CompanyInfoItem[] = [
  {
    id: "basic",
    title: "기본 정보",
    description: "(현재 기준) 회사 로고, 회사 이름(국문), 대표자, 주소, 홈페이지 주소, 업종, 설립일",
    items: [
      "회사 로고",
      "회사 이름(국문)",
      "대표자",
      "주소",
      "홈페이지 주소",
      "업종: 광고산업 분류 기준",
      "설립일 (yyyy.mm.dd)",
    ],
    isFixed: true,
  },
  {
    id: "philosophy",
    title: "철학 및 비전",
    description: "비전과 목표, CEO 메시지, 브랜드 보이스",
    items: [
      "비전과 목표",
      "CEO 메시지",
      "브랜드 보이스: 핵심가치, 핵심 톤앤매너, 키워드 금기어",
    ],
    isFixed: true,
  },
  {
    id: "history",
    title: "역사",
    description: "설립 배경, 연혁",
    items: [
      "설립 배경",
      "주요 연혁",
    ],
    isFixed: true,
  },
  {
    id: "business",
    title: "주요 사업",
    description: "사업 분야, 상품/서비스, 수익모델",
    items: [
      "주요 사업 분야",
      "주요 상품/서비스",
      "수익모델",
    ],
    isFixed: false,
  },
  {
    id: "finance",
    title: "재무 정보",
    description: "최근 매출, 투자 및 비용 구조",
    items: [
      "매출: 최근 3년 매출 (연도별 추이), 성장률, 사업별 매출 비중",
      "영업이익: 영업이익 (연도별 추이)",
      "투자 및 비용 구조: 마케팅비, R&D 비중",
    ],
    isFixed: false,
  },
]

const MENU_ITEMS: MenuItem[] = [
  {
    id: "company",
    title: "기업 정보",
    isFixed: true,
    defaultItems: [
      "기본 정보 (회사 로고, 회사 이름, 대표자, 주소, 홈페이지, 업종, 설립일)",
      "철학 및 비전 (비전과 목표, CEO 메시지, 브랜드 보이스)",
      "역사 (설립 배경, 주요 연혁)",
      "주요 사업 (사업 분야, 상품/서비스, 수익모델)",
      "재무 정보 (최근 3년 매출, 영업이익, 투자 및 비용 구조)",
    ],
  },
  {
    id: "market",
    title: "시장 현황",
    isFixed: false,
    defaultItems: [
      "방송통신 산업 현황 및 트렌드",
      "지역별 방송/통신 시장 규모 및 성장 전망",
      "규제 환경 및 정책 동향",
    ],
  },
  {
    id: "ownCompany",
    title: "자사 분석",
    isFixed: false,
    defaultItems: [
      "가입자 수, 시장 점유율 및 서비스별 실적",
      "주요 서비스(헬로TV, 헬로넷, 헬로전화, 헬로모바일) 현황",
    ],
  },
  {
    id: "competitor",
    title: "경쟁사 분석",
    isFixed: false,
    defaultItems: [
      "주요 경쟁사 비교 (시장 점유율, 서비스 범위, 요금제 등)",
      "경쟁사의 강점 및 약점",
    ],
  },
  {
    id: "target",
    title: "타겟 분석",
    isFixed: false,
    defaultItems: [
      "주요 고객 세그먼트 및 특성",
      "고객 니즈 및 선호도 분석",
    ],
  },
]

export function MenuConfigStep({ formData, setFormData }: MenuConfigStepProps) {
  // 컴포넌트 마운트 시 company 섹션이 없으면 기본값으로 초기화
  useEffect(() => {
    if (!setFormData) return
    
    // company 섹션이 없거나 비어있으면 기본값으로 초기화
    if (!formData.menuItems?.company || formData.menuItems.company.length === 0) {
      const companyMenu = MENU_ITEMS.find((m) => m.id === "company")
      if (companyMenu) {
        setFormData({
          ...formData,
          menuItems: {
            ...formData.menuItems,
            company: [...companyMenu.defaultItems],
          },
        })
      }
    }
  }, []) // 마운트 시 한 번만 실행
  
  const getMenuItems = (menuId: string): string[] => {
    return formData.menuItems?.[menuId] || MENU_ITEMS.find((m) => m.id === menuId)?.defaultItems || []
  }

  const getCompanyInfoEnabled = (itemId: string): boolean => {
    return formData.companyInfoItems?.[itemId] ?? (COMPANY_INFO_ITEMS.find((item) => item.id === itemId)?.isFixed ?? false)
  }

  const handleCompanyInfoToggle = (itemId: string, checked: boolean) => {
    if (setFormData) {
      setFormData({
        ...formData,
        companyInfoItems: {
          ...formData.companyInfoItems,
          [itemId]: checked,
        },
      })
    }
  }

  const handleAddItem = (menuId: string) => {
    if (setFormData) {
      const currentItems = getMenuItems(menuId)
      if (currentItems.length < 10) {
        setFormData({
          ...formData,
          menuItems: {
            ...formData.menuItems,
            [menuId]: [...currentItems, ""],
          },
        })
      }
    }
  }

  const handleRemoveItem = (menuId: string, index: number) => {
    if (setFormData) {
      const currentItems = getMenuItems(menuId)
      const menuItem = MENU_ITEMS.find((m) => m.id === menuId)
      
      // 고정 항목이고 기본 항목인 경우 삭제 불가
      if (menuItem?.isFixed && index < menuItem.defaultItems.length) {
      return
    }

      const newItems = currentItems.filter((_: string, i: number) => i !== index)
      setFormData({
        ...formData,
        menuItems: {
          ...formData.menuItems,
          [menuId]: newItems,
        },
      })
    }
  }

  const handleUpdateItem = (menuId: string, index: number, value: string) => {
    if (setFormData) {
      const currentItems = getMenuItems(menuId)
      const newItems = [...currentItems]
      newItems[index] = value
      setFormData({
        ...formData,
        menuItems: {
          ...formData.menuItems,
          [menuId]: newItems,
        },
      })
    }
  }

  const handleToggle = (checked: boolean) => {
    if (setFormData) {
      setFormData({
        ...formData,
        analysisItems: {
          ...formData.analysisItems,
          media: checked,
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 제목 섹션 */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          팩트북의 메뉴 항목을 설정하세요.
        </h3>
      </div>

      {/* 메뉴 항목 리스트 - 그리드 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MENU_ITEMS.map((menu, idx) => {
          const items = getMenuItems(menu.id)
          const canAdd = items.length < 10
          const isCompanyInfo = menu.id === "company"

          return (
            <div key={menu.id} className="px-4 pt-4 pb-3 bg-muted/30 rounded-lg border border-border flex flex-col">
              {/* 번호와 목차명 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="text-sm font-bold text-foreground truncate">{menu.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-primary hover:text-primary flex-shrink-0"
                    onClick={() => handleAddItem(menu.id)}
                    disabled={!canAdd}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    추가
                  </Button>
                </div>
              </div>

              {/* 세부 항목 리스트 */}
              <div className="space-y-2 flex-1">
                {items.map((item: string, itemIdx: number) => {
                  const isFixed = menu.isFixed && itemIdx < menu.defaultItems.length
                  
                  // 기업 정보의 경우, 주요 사업과 재무 정보는 토글로 처리
                  if (isCompanyInfo) {
                    const isBusinessItem = itemIdx === 3 // 주요 사업
                    const isFinanceItem = itemIdx === 4 // 재무 정보
                    const isToggleable = isBusinessItem || isFinanceItem
                    const itemKey = isBusinessItem ? "business" : isFinanceItem ? "finance" : null
                    const isEnabled = itemKey ? getCompanyInfoEnabled(itemKey) : true

                    return (
                      <div key={itemIdx} className="flex items-center gap-2">
                        <Input
                          placeholder="내용을 입력하세요."
                          value={item}
                          onChange={(e) => handleUpdateItem(menu.id, itemIdx, e.target.value)}
                          disabled={isFixed || (isToggleable && !isEnabled)}
                          className="flex-1 text-xs"
                        />
                        {isToggleable && (
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => itemKey && handleCompanyInfoToggle(itemKey, checked)}
                            className="flex-shrink-0"
                          />
                        )}
                        {!isFixed && !isToggleable && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(menu.id, itemIdx)}
                            className="flex-shrink-0 text-destructive hover:text-destructive h-8 w-8"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div key={itemIdx} className="flex gap-2">
                      <Input
                        placeholder="내용을 입력하세요."
                        value={item}
                        onChange={(e) => handleUpdateItem(menu.id, itemIdx, e.target.value)}
                        disabled={isFixed}
                        className="flex-1 text-xs"
                      />
                      {!isFixed && (
              <Button
                variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(menu.id, itemIdx)}
                          className="flex-shrink-0 text-destructive hover:text-destructive h-8 w-8"
                        >
                          <X className="w-3 h-3" />
              </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* 매체 소재 분석 - 전체 너비 */}
        <div className="col-span-full px-4 pt-4 pb-3 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {MENU_ITEMS.length + 1}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">매체 소재 분석</span>
              <Switch
                checked={formData.analysisItems?.media ?? false}
                onCheckedChange={handleToggle}
              />
            </div>
          </div>
          <div className="ml-9">
            <p className="text-xs text-muted-foreground leading-relaxed">
              자사 및 경쟁사 매체별 소재 (메타, 인스타그램, 구글, Youtube)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
