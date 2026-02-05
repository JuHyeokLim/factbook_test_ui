"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Lock, Layout, BarChart3, Building2, Users, Target, Info, Sparkles, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface MenuConfigStepProps {
  formData: any
  setFormData?: (data: any) => void
}

interface MenuItem {
  id: string
  title: string
  icon: React.ReactNode
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
    isFixed: true,
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
    isFixed: true,
  },
]

const MENU_ITEMS: MenuItem[] = [
  {
    id: "company",
    title: "기업 정보",
    icon: <Building2 className="w-4 h-4" />,
    isFixed: true,
    defaultItems: [
      "기본 정보 (기업명, 대표자, 설립일, 업종, 주소, 홈페이지)",
      "철학 및 비전 (비전과 목표, CEO 메시지, 브랜드 보이스 등)",
      "역사 (설립 배경, 주요 연혁 등)",
      "주요 사업 (사업 분야, 상품/서비스, 수익모델 등)",
      "재무 정보 (최근 3년 매출, 영업이익, 투자 및 비용 구조 등)",
    ],
  },
  {
    id: "market",
    title: "시장 현황",
    icon: <BarChart3 className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [],
  },
  {
    id: "ownCompany",
    title: "자사 분석",
    icon: <Layout className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [],
  },
  {
    id: "competitor",
    title: "경쟁사 분석",
    icon: <Users className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [],
  },
  {
    id: "target",
    title: "타겟 분석",
    icon: <Target className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [],
  },
]

export function MenuConfigStep({ formData, setFormData }: MenuConfigStepProps) {
  const [isRecommending, setIsRecommending] = useState(false)
  const { toast } = useToast()

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

  const handleGetAIRecommendation = async () => {
    if (!formData.companyName) {
      toast({
        title: "정보 부족",
        description: "기업명을 먼저 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    if (!setFormData) return

    setIsRecommending(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const response = await fetch(`${backendUrl}/api/recommend-menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: formData.companyName,
          category: formData.category || "기타",
          items: formData.items.map((item: any) => ({
            id: item.id,
            product_name: item.productName,
            competitors: item.competitors,
            proposals: item.proposals,
            target_customers: item.targetCustomers
          }))
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "추천 실패" }))
        throw new Error(errorData.detail || "목차 추천에 실패했습니다.")
      }

      const result = await response.json()
      if (result.success && result.menu_recommendations) {
        // 기존 company 항목은 유지하고 나머지만 업데이트
        const updatedMenuItems = {
          ...formData.menuItems,
          ...result.menu_recommendations,
          company: formData.menuItems?.company || MENU_ITEMS.find(m => m.id === "company")?.defaultItems
        }

        setFormData({
          ...formData,
          menuItems: updatedMenuItems
        })

        toast({
          title: "추천 완료",
          description: "AI 목차 추천이 완료되었습니다."
        })
      }
    } catch (error) {
      console.error("AI 목차 추천 실패:", error)
      toast({
        title: "추천 실패",
        description: error instanceof Error ? error.message : "목차 추천 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsRecommending(false)
    }
  }

  // 텍스트 영역 높이 자동 조절 (최대 3줄)
  useEffect(() => {
    const adjustHeight = () => {
      const textareas = document.querySelectorAll('.menu-item-textarea');
      textareas.forEach(ta => {
        if (ta instanceof HTMLTextAreaElement) {
          ta.style.height = 'auto';
          ta.style.height = `${Math.min(ta.scrollHeight, 68)}px`;
        }
      });
    };

    adjustHeight();
    // 데이터가 변경될 때마다 다시 조정
  }, [formData.menuItems]);
  
  const getMenuItems = (menuId: string): string[] => {
    return formData.menuItems?.[menuId] || MENU_ITEMS.find((m) => m.id === menuId)?.defaultItems || []
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-none p-5">
      {/* 제목 및 가이드 섹션 */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              목차 구성 설정
            </h3>
          </div>
          <p className="text-[13px] text-slate-500 font-medium ml-9">
            팩트북의 목차 항목을 확인하고 필요에 따라 수정하거나 추가할 수 있습니다.
          </p>
        </div>

        <Button
          onClick={handleGetAIRecommendation}
          disabled={isRecommending}
          className={cn(
            "relative overflow-hidden px-6 h-11 rounded-xl font-bold transition-all active:scale-95 shadow-sm",
            "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0",
            "disabled:opacity-70 disabled:cursor-not-allowed"
          )}
        >
          {isRecommending ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI 목차 생성 중...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI 목차 추천</span>
            </div>
          )}
        </Button>
      </div>

      {/* 메뉴 항목 리스트 - 그리드 레이아웃 */}
      <div className="relative min-h-[400px]">
        {isRecommending ? (
          <div className="absolute inset-0 z-20 bg-white rounded-3xl flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-lg font-bold text-slate-900">AI 목차 추천 중</p>
                <p className="text-sm text-slate-500 font-medium">
                  입력하신 정보를 바탕으로 목차를 추천하고 있습니다.<br />
                  잠시만 기다려 주세요.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {MENU_ITEMS.map((menu) => {
              const items = getMenuItems(menu.id)
              const canAdd = items.length < 10
              const isCompanyInfo = menu.id === "company"

              return (
                <div 
                  key={menu.id} 
                  className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* 카드 헤더 */}
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                        {menu.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-slate-800 tracking-tight">{menu.title}</span>
                        <span className="text-[11px] text-slate-400 font-medium">총 {items.length}개 항목</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-[12px] font-semibold border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all rounded-lg gap-1.5"
                      onClick={() => handleAddItem(menu.id)}
                      disabled={!canAdd}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      항목 추가
                    </Button>
                  </div>

                  {/* 세부 항목 리스트 */}
                  <div className="p-5 space-y-3 flex-1 bg-white">
                    {items.length === 0 ? (
                      <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                        <p className="text-[13px] text-slate-400 font-medium">추가된 항목이 없습니다.</p>
                      </div>
                    ) : (
                      items.map((item: string, itemIdx: number) => {
                        const isFixed = menu.isFixed && itemIdx < menu.defaultItems.length
                        
                        return (
                          <div 
                            key={itemIdx} 
                            className={cn(
                              "relative group/item flex items-start gap-3 p-3 rounded-xl border transition-all duration-200",
                              isFixed 
                                ? "bg-slate-50/50 border-slate-100" 
                                : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm"
                            )}
                          >
                            <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-blue-400 shrink-0" />
                            <Textarea
                              placeholder="내용을 입력하세요."
                              value={item}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateItem(menu.id, itemIdx, e.target.value)}
                              onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 68)}px`;
                              }}
                              disabled={isFixed}
                              className={cn(
                                "menu-item-textarea flex-1 text-[13px] leading-relaxed min-h-[20px] max-h-[68px] p-0 bg-transparent border-none shadow-none focus-visible:ring-0 resize-none font-medium transition-all overflow-y-auto",
                                isFixed ? "text-slate-500" : "text-slate-700"
                              )}
                            />
                            {isFixed ? (
                              <div className="p-1.5 text-slate-300">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(menu.id, itemIdx)}
                                className="shrink-0 h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}

            {/* 매체 소재 분석 - 비활성화 (주석 처리)
            <div className="col-span-full mt-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-blue-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[15px] font-bold text-slate-800">매체 소재 분석</h4>
                    </div>
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                      자사 및 경쟁사의 매체별 소재(페이스북, 인스타그램, 구글, Youtube)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/50 px-4 py-3 rounded-xl border border-blue-100/50">
                  <span className="text-[13px] font-bold text-slate-600">활성화</span>
                  <Switch
                    checked={formData.analysisItems?.media ?? false}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </div>
            */}
          </div>
        )}
      </div>    </div>
  )
}
