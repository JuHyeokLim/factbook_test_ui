"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUp } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { MediaTab } from "@/components/factbook/media-tab"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ImageViewer } from "@/components/factbook/image-viewer"

interface Source {
  title: string
  content: string
  media: string
  imageUrl?: string
}

interface SubSection {
  id: string
  title: string
  content: string
}

interface Section {
  id: string
  title: string
  subSections: SubSection[]
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
  const [activeSection, setActiveSection] = useState<string>("1-1")
  const [activeTab, setActiveTab] = useState<"factbook" | "media">("factbook")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
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
          title: "기업 정보",
          subSections: [
            {
              id: "1-1",
              title: "기본 정보",
              content: "회사명: LG헬로비전 주식회사\n설립일: 1995년 3월 31일\n대표자: 송구영\n주소: 서울특별시 마포구 월드컵북로 56길 19 (상암동 드림타워)\n홈페이지: www.lghellovision.net",
            },
            {
              id: "1-2",
              title: "철학 및 비전",
              content: "LG헬로비전은 고객 중심의 서비스와 혁신을 통해 디지털 미디어 플랫폼의 선도 기업이 되겠습니다.",
            },
            {
              id: "1-3",
              title: "역사",
              content: "1995년 3월 31일 설립, 국내 케이블TV 방송 사업 시작",
            },
          ],
          sources: [
            {
              title: "회사의 개요",
              content: "당사의 명칭은 주식회사엘지헬로비전이며, 영문으로는 LG HelloVisionCorp.",
              media: "대홍뉴스",
              imageUrl: "/placeholder.jpg",
            },
          ],
        },
        {
          id: "2",
          title: "시장 현황",
          subSections: [
            {
              id: "2-1",
              title: "방송통신 산업 현황 및 트렌드",
              content: "2025년 6월말 연결누적기준 사업부문별 주요서비스실적은 방송사업 21.1%, 인터넷사업 9.5%, 광고서비스사업 18.3%, 부가서비스사업 19.9%, 상품 31.2% 입니다.",
            },
          ],
          sources: [
            {
              title: "한국 방송통신 시장 현황",
              content: "2024년 상반기 케이블 방송 시장 분석",
              media: "롯데인사이트",
              imageUrl: "/placeholder.jpg",
            },
          ],
        },
        {
          id: "3",
          title: "자사 분석",
          subSections: [
            {
              id: "3-1",
              title: "가입자 수, 시장 점유율 및 서비스별 실적",
              content: "LG헬로비전은 전국적으로 약 500만 가입자를 보유하고 있으며, 케이블TV 시장 점유율 15%를 차지하고 있습니다.",
            },
          ],
          sources: [],
        },
        {
          id: "4",
          title: "경쟁사 분석",
          subSections: [
            {
              id: "4-1",
              title: "주요 경쟁사 비교",
              content: "주요 경쟁사인 SK브로드밴드, LG U+와의 경쟁이 심화되고 있습니다. 각 사는 초고속 인터넷과 OTT 서비스를 결합한 패키지 전략으로 고객 확보에 집중하고 있습니다.",
            },
          ],
          sources: [
            {
              title: "케이블 사업자별 경쟁 전략",
              content: "2024년 케이블 방송 시장 경쟁사 분석",
              media: "롯데인사이트",
            },
          ],
        },
        {
          id: "5",
          title: "타겟 분석",
          subSections: [
            {
              id: "5-1",
              title: "주요 고객 세그먼트 및 특성",
              content: "주요 타겟은 30-50대 가구주로, 가정용 통신 서비스와 엔터테인먼트 콘텐츠에 높은 관심을 보입니다.",
            },
          ],
          sources: [],
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

  const handleSubSectionClick = (subSectionId: string) => {
    setActiveSection(subSectionId)
    const element = document.getElementById(`section-${subSectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (!factbook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">로딩 중...</div>
      </div>
    )
  }

  const allImages = factbook.sections.flatMap((section) =>
    section.sources.filter((s) => s.imageUrl).map((s) => s.imageUrl!)
  )

  const handleImageClick = (imageUrl: string) => {
    const index = allImages.indexOf(imageUrl)
    if (index !== -1) {
      setSelectedImageIndex(index)
    }
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1)
    }
  }

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < allImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

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

            <Accordion type="single" collapsible className="w-full">
              {factbook.sections.map((section, idx) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="text-sm font-medium text-slate-900 py-2">
                    {idx + 1}. {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-2">
                      {section.subSections.map((subSection) => {
                        const isActive = activeSection === subSection.id
                        return (
                          <button
                            key={subSection.id}
                            onClick={() => handleSubSectionClick(subSection.id)}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all ${
                              isActive
                                ? "bg-blue-100 text-blue-700 font-medium"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {subSection.title}
                          </button>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </aside>
        )}

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === "factbook" ? (
              <div className="max-w-3xl space-y-12">
                {factbook.sections.map((section) => (
                  <div key={section.id}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">{section.title}</h2>
                    {section.subSections.map((subSection) => (
                      <section
                        key={subSection.id}
                        id={`section-${subSection.id}`}
                        className="mb-8 scroll-mt-8"
                      >
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">{subSection.title}</h3>
                        <div className="space-y-4">
                          <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                            {subSection.content}
                          </div>
                          {/* 플레이스홀더 바 (기획서처럼) */}
                          <div className="space-y-3 mt-4">
                            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </section>
                    ))}
                  </div>
                ))}
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
              {/* 출처 이미지 */}
              {allImages.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-3 text-sm">출처 이미지</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {allImages.map((imageUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleImageClick(imageUrl)}
                        className="aspect-square bg-slate-200 rounded border border-slate-300 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
                      >
                        <span className="text-xs text-slate-500">이미지</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 출처정보 제목 */}
              <div>
                <h3 className="font-bold text-slate-900 mb-3 text-sm">출처</h3>
                {factbook.sections
                  .flatMap((s) => s.sources)
                  .filter((s) => !s.imageUrl).length > 0 ? (
                  <div className="space-y-3">
                    {factbook.sections
                      .flatMap((s) => s.sources)
                      .filter((s) => !s.imageUrl)
                      .map((source, idx) => (
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

      {/* 이미지 전체 화면 보기 팝업 */}
      {selectedImageIndex !== null && allImages.length > 0 && (
        <ImageViewer
          images={allImages}
          currentIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
        />
      )}
    </div>
  )
}
