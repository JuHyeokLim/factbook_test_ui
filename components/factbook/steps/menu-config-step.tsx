"use client"

import { useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X, Lock, Layout, BarChart3, Building2, Users, Target, Info, Sparkles, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
    icon: <BarChart3 className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [
      "국내 광고/마케팅 시장의 최근 3년간 규모 및 연평균 성장률 분석",
      "디지털 광고 시장의 메타, 구글, 유튜브 등 주요 플랫폼별 트렌드 및 성장 전망 분석",
      "광고/마케팅 서비스의 AI 기술 도입, 크리에이티브 자동화, 데이터 기반 마케팅 등 최신 산업 트렌드 분석",
    ],
  },
  {
    id: "ownCompany",
    title: "자사 분석",
    icon: <Layout className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [
      "대홍기획의 광고/마케팅 서비스별 핵심 USP 및 세부 역량 분석",
      "대홍기획 주력 서비스의 출시 배경, 주요 업데이트 및 클라이언트 유치 캠페인 변화 과정 분석",
      "대홍기획의 퍼포먼스 마케팅 서비스 제공 역량 및 성공 사례 분석",
    ],
  },
  {
    id: "competitor",
    title: "경쟁사 분석",
    icon: <Users className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [
      "대홍기획의 주요 경쟁사(제일기획, 이노션, HSAD) 비교 (시장 점유율, 주요 클라이언트, 서비스 역량 등)",
      "경쟁사(제일기획, 이노션, HSAD) 대비 대홍기획의 차별화 포인트 및 경쟁 우위 요소 도출",
      "경쟁 환경에서 대홍기획의 시장 내 위치 및 역할 분석",
    ],
  },
  {
    id: "target",
    title: "타겟 분석",
    icon: <Target className="w-4 h-4" />,
    isFixed: false,
    defaultItems: [
      "광고/마케팅 서비스 클라이언트의 관심사, 가치관, 라이프스타일, 미디어 소비 패턴 등 심리/행동적 특성 분석",
      "광고/마케팅 서비스에 대한 클라이언트의 미충족 니즈, 구매 고려 요인, 선호도 분석",
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
      <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-6">
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

      {/* 메뉴 항목 리스트 - 그리드 레이아웃 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

        {/* 매체 소재 분석 - 특수 기능 카드 */}
        <div className="col-span-full mt-2">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 shadow-sm flex items-center justify-center text-blue-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-[15px] font-bold text-slate-800">매체 소재 분석</h4>
                  {/* <span className="px-2 py-0.5 bg-blue-600 text-[10px] font-bold text-white rounded-full tracking-wider">RECOMMENDED</span> */}
                </div>
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                  자사 및 경쟁사의 매체별 소재(메타, 인스타그램, 구글, Youtube)
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
      </div>
    </div>
  )
}
