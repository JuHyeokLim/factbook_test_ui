"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUp } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { MediaTab } from "@/components/factbook/media-tab"

interface Source {
  title: string
  content: string
  media: string
}

interface Section {
  id: string
  title: string
  content: string
  sources: Source[]
}

interface FactbookDetail {
  id: string
  companyName: string
  productName: string
  category: string
  sections: Section[]
}

export default function FactbookDetailPage() {
  const params = useParams()
  const [factbook, setFactbook] = useState<FactbookDetail | null>(null)
  const [activeSection, setActiveSection] = useState<string>("1")
  const [activeTab, setActiveTab] = useState<"factbook" | "media">("factbook")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const mockData: FactbookDetail = {
      id: params.id as string,
      companyName: "LG 헬로비전",
      productName: "케이블TV, 인터넷전화",
      category: "컴퓨터 및 정보통신",
      sections: [
        {
          id: "1",
          title: "기업 기본정보",
          content:
            "LG헬로비전은 1995년 3월 31일 종합유선방송법에 의해 설립되어 종합유선방송국운영사업, 비디오물, 광고, CF의 제작판매 및 전기통신사업법상 기간통신사업, 별정통신사업과 부가통신사업 등을 주요사업으로 영위하고 있습니다.",
          sources: [
            {
              title: "회사의 개요",
              content: "당사의 명칭은 주식회사엘지헬로비전이며, 영문으로는 LG HelloVisionCorp.",
              media: "대홍뉴스",
            },
          ],
        },
        {
          id: "2",
          title: "시장현황",
          content:
            "2025년 6월말 연결누적기준 사업부문별 주요서비스실적은 방송사업 21.1%, 인터넷사업 9.5%, 광고서비스사업 18.3%, 부가서비스사업 19.9%, 상품 31.2% 입니다.",
          sources: [
            {
              title: "한국 방송통신 시장 현황",
              content: "2024년 상반기 케이블 방송 시장 분석",
              media: "롯데인사이트",
            },
          ],
        },
        {
          id: "3",
          title: "경쟁사 분석",
          content:
            "주요 경쟁사인 SK브로드밴드, LG U+와의 경쟁이 심화되고 있습니다. 각 사는 초고속 인터넷과 OTT 서비스를 결합한 패키지 전략으로 고객 확보에 집중하고 있습니다.",
          sources: [
            {
              title: "케이블 사업자별 경쟁 전략",
              content: "2024년 케이블 방송 시장 경쟁사 분석",
              media: "롯데인사이트",
            },
          ],
        },
        {
          id: "4",
          title: "소재 분석",
          content:
            "LG헬로비전의 광고 소재는 전통 매체(TV, 신문)와 디지털 매체(인터넷, 모바일)를 통합하여 활용하고 있습니다. 최근 디지털 매체 비중이 증가하고 있으며, 영상 기반 광고 효과가 높게 평가되고 있습니다.",
          sources: [
            {
              title: "디지털 광고 소재 트렌드",
              content: "2024년 광고 매체별 투자 동향",
              media: "롯데인사이트",
            },
          ],
        },
      ],
    }

    setFactbook(mockData)
  }, [params.id])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "공유링크가 복사되었습니다.",
      duration: 1000,
    })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "링크가 복사되었습니다.",
      duration: 1000,
    })
  }

  const handleDelete = () => {
    if (confirm("팩트북을 삭제하시겠습니까?")) {
      toast({
        title: "팩트북이 삭제되었습니다.",
        duration: 1000,
      })
    }
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!factbook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">로딩 중...</div>
      </div>
    )
  }

  const sectionColors = {
    "1": { badge: "bg-blue-600", text: "text-blue-600", light: "bg-blue-100" },
    "2": { badge: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-100" },
    "3": { badge: "bg-orange-600", text: "text-orange-600", light: "bg-orange-100" },
    "4": { badge: "bg-pink-600", text: "text-pink-600", light: "bg-pink-100" },
  }

  const activeColor = sectionColors[activeSection as keyof typeof sectionColors] || sectionColors["1"]
  const activeSectionData = factbook.sections.find((s) => s.id === activeSection)

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white border-b border-slate-300 z-50">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* 왼쪽: 뒤로가기, 회사명 */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>

              {/* 제목 */}
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-slate-900 truncate">
                  {factbook.companyName} {factbook.productName}
                </h1>
              </div>
            </div>

            {/* 중앙: 팩트북/매체소재 탭 */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-2 border border-slate-300 rounded-lg p-1">
              <Button
                variant={activeTab === "factbook" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("factbook")}
                className="h-8 px-6"
              >
                팩트북
              </Button>
              <Button
                variant={activeTab === "media" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("media")}
                className="h-8 px-6"
              >
                매체소재
              </Button>
            </div>

            {/* 오른쪽: 액션 버튼 */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare} 
                className="h-8 text-slate-700 text-xs border-slate-300 hover:bg-slate-50"
              >
                공유
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete} 
                className="h-8 text-slate-700 text-xs border-slate-300 hover:bg-slate-50"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)] overflow-hidden">
        {/* 팩트북 탭일 때만 목차 사이드바 표시 */}
        {activeTab === "factbook" && (
          <aside className="w-64 border-r border-slate-300 bg-slate-50 p-6 overflow-y-auto flex-shrink-0">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="font-bold text-slate-900 text-sm">목차</h3>
            </div>

            <nav className="space-y-2">
              {factbook.sections.map((section, idx) => {
                const isActive = activeSection === section.id
                const colors = sectionColors[section.id as keyof typeof sectionColors]

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? `bg-blue-100 text-blue-700 border-l-2 border-blue-600`
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="flex-1">{section.title}</span>
                  </button>
                )
              })}
            </nav>
          </aside>
        )}

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === "factbook" ? (
              <div className="max-w-3xl space-y-8">
                {activeSectionData && (
                  <section>
                    {/* 섹션 제목 */}
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-slate-900">{activeSectionData.title}</h2>
                    </div>

                    {/* 섹션 콘텐츠 */}
                    <div className="space-y-6">
                      <p className="text-slate-700 text-sm leading-relaxed">{activeSectionData.content}</p>

                      {/* 플레이스홀더 바 (기획서처럼) */}
                      <div className="space-y-3 mt-8">
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <MediaTab factbookId={params.id as string} />
            )}
          </div>
        </div>

        {/* 팩트북 탭일 때만 출처정보 패널 표시 */}
        {activeTab === "factbook" && (
          <aside className="w-56 border-l border-slate-300 bg-slate-50 p-6 overflow-y-auto flex-shrink-0">
            <div className="space-y-6">
              {/* 출처정보 제목 */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3 text-sm">출처</h3>
                {activeSectionData && activeSectionData.sources.length > 0 ? (
                  <div className="space-y-3">
                    {activeSectionData.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <p className="font-semibold text-slate-900 text-xs line-clamp-2">{source.title}</p>
                        <p className="text-slate-600 text-xs mt-2 line-clamp-2">{source.content}</p>
                        <p className="text-blue-600 text-xs mt-2 font-medium hover:underline">{source.media}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">출처 정보가 없습니다.</p>
                )}
              </div>

              {/* 구분선 */}
              <div className="border-t border-slate-300"></div>

              {/* 위로가기 버튼 */}
              <button
                onClick={handleScrollToTop}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition-colors"
              >
                <ArrowUp className="w-3 h-3" />
                위로가기
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* 맨 위로 스크롤 버튼 */}
      {showScrollButton && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-all z-40"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
