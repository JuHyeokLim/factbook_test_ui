"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUp } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { MediaTab } from "@/components/factbook/media-tab"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ImageViewer } from "@/components/factbook/image-viewer"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Source {
  title: string
  content: string
  media: string
  url?: string
  imageUrl?: string
}

interface SubSection {
  id: string
  title: string
  content: string
  sources?: Source[] // subSection 레벨에 sources 추가
}

interface Section {
  id: string
  title: string
  subSections: SubSection[]
  sources?: Source[] // 선택적으로 유지 (계산용)
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
  const router = useRouter()
  const [factbook, setFactbook] = useState<FactbookDetail | null>(null)
  const [activeSection, setActiveSection] = useState<string>("1-1")
  const [activeTab, setActiveTab] = useState<"factbook" | "media">("factbook")
  const [sourceTab, setSourceTab] = useState<"source" | "image">("source") // 출처/이미지 탭
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set()) // 로드 실패한 이미지 URL 저장
  const [isManualScroll, setIsManualScroll] = useState(false) // 수동 스크롤 여부
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchFactbook = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        const response = await fetch(`${backendUrl}/api/factbooks/${params.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "팩트북을 찾을 수 없습니다.",
              variant: "destructive",
            })
            return
          }
          throw new Error("팩트북 조회 실패")
        }
        
        const data = await response.json()
        
        // 백엔드 응답 형식을 프론트엔드 형식으로 변환
        const factbook: FactbookDetail = {
          id: String(data.id),
          companyName: data.company_name || "",
          productName: data.product_name || "",
          category: data.category || "",
          sections: (data.sections || []).map((section: any) => {
            // subSection 레벨에 sources 유지
            const subSectionsWithSources = (section.subSections || []).map((subSection: any) => ({
              id: subSection.id || "",
              title: subSection.title || "",
              content: subSection.content || "",
              sources: (subSection.sources || []).map((source: any) => ({
                title: source.title || "",
                content: source.content || "",
                media: source.media || "",
                url: source.url || "",
                imageUrl: source.imageUrl || undefined,
              })),
            }))

            // section 레벨의 sources는 모든 subSection의 sources를 flatMap (계산용)
            const allSources: Source[] = subSectionsWithSources.flatMap(
              (subSection: SubSection) => subSection.sources || []
            )

            return {
              id: String(section.id),
              title: section.title || "",
              subSections: subSectionsWithSources,
              sources: allSources, // 계산용으로 유지
            }
          }),
        }
        
        setFactbook(factbook)
        
        // 첫 번째 섹션을 기본 활성화
        if (factbook.sections.length > 0 && factbook.sections[0].subSections.length > 0) {
          setActiveSection(factbook.sections[0].subSections[0].id)
        }
      } catch (error) {
        console.error("팩트북 조회 실패:", error)
        toast({
          title: "팩트북을 불러오는데 실패했습니다.",
          variant: "destructive",
        })
      }
    }
    
    if (params.id) {
      fetchFactbook()
    }
  }, [params.id, toast])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Intersection Observer로 현재 보이는 섹션 감지
  useEffect(() => {
    if (!factbook || activeTab !== "factbook") return

    // 수동 스크롤 중이면 observer 비활성화
    if (isManualScroll) {
      const timer = setTimeout(() => {
        setIsManualScroll(false)
      }, 1000)
      return () => clearTimeout(timer)
    }

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px", // 화면 상단 20% ~ 하단 60% 영역
      threshold: 0,
    }

    const sectionElements: { element: HTMLElement; id: string }[] = []
    const visibilityMap = new Map<string, number>()

    // 모든 섹션 요소 수집
    factbook.sections.forEach((section) => {
      section.subSections.forEach((subSection) => {
        const element = document.getElementById(`section-${subSection.id}`)
        if (element) {
          sectionElements.push({ element, id: subSection.id })
        }
      })
    })

    if (sectionElements.length === 0) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.id.replace("section-", "")
        if (entry.isIntersecting) {
          // 화면에 보이는 영역의 비율 계산
          const rect = entry.boundingClientRect
          const viewportHeight = window.innerHeight
          const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
          const visibility = Math.max(0, visibleHeight / viewportHeight)
          visibilityMap.set(sectionId, visibility)
        } else {
          visibilityMap.delete(sectionId)
        }
      })

      // 가장 많이 보이는 섹션 찾기
      if (visibilityMap.size > 0 && !isManualScroll) {
        let maxVisibility = 0
        let mostVisibleSection = ""
        
        visibilityMap.forEach((visibility, sectionId) => {
          if (visibility > maxVisibility) {
            maxVisibility = visibility
            mostVisibleSection = sectionId
          }
        })

        if (mostVisibleSection && mostVisibleSection !== activeSection) {
          setActiveSection(mostVisibleSection)
        }
      }
    }, observerOptions)

    // 모든 섹션 observe
    sectionElements.forEach(({ element }) => {
      observer.observe(element)
    })

    return () => {
      sectionElements.forEach(({ element }) => {
        observer.unobserve(element)
      })
    }
  }, [factbook, activeTab, isManualScroll, activeSection])

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

  const handleDelete = async () => {
    if (!confirm("팩트북을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return
    }

    setIsDeleting(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const response = await fetch(`${backendUrl}/api/factbooks/${params.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "삭제 실패" }))
        throw new Error(errorData.detail || "팩트북 삭제에 실패했습니다.")
      }

      toast({
        title: "팩트북이 삭제되었습니다.",
        duration: 2000,
      })

      // 메인 페이지로 리다이렉트
      setTimeout(() => {
        router.push("/")
      }, 500)
    } catch (error) {
      console.error("팩트북 삭제 실패:", error)
      toast({
        title: "팩트북 삭제에 실패했습니다.",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubSectionClick = (subSectionId: string) => {
    setActiveSection(subSectionId)
    // 섹션 변경 시 이미지 뷰어 닫기
    setSelectedImageIndex(null)
    // 수동 스크롤 시작
    setIsManualScroll(true)
    const element = document.getElementById(`section-${subSectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (!factbook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <div className="text-slate-600">팩트북을 불러오는 중...</div>
        </div>
      </div>
    )
  }

  // 활성화된 섹션의 출처와 이미지 가져오기
  const getActiveSectionData = () => {
    if (!factbook) {
      return { sources: [], images: [] }
    }
    
    // activeSection (예: "1-1")에 해당하는 subSection 찾기
    let activeSubSection: SubSection | null = null
    
    for (const section of factbook.sections) {
      const subSection = section.subSections.find((ss) => ss.id === activeSection)
      if (subSection) {
        activeSubSection = subSection
        break
      }
    }
    
    if (!activeSubSection || !activeSubSection.sources) {
      return { sources: [], images: [] }
    }
    
    // 해당 subSection의 sources 사용
    const sources = activeSubSection.sources || []
    const images = sources.filter((s) => s.imageUrl).map((s) => s.imageUrl!)
    
    return { sources, images }
  }

  const { sources: activeSources, images: activeImages } = getActiveSectionData()

  const handleImageClick = (imageUrl: string) => {
    const index = activeImages.indexOf(imageUrl)
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
    if (selectedImageIndex !== null && selectedImageIndex < activeImages.length - 1) {
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
                disabled={isDeleting}
                className="h-8 text-slate-700 text-xs border-slate-300 hover:bg-slate-50"
              >
                {isDeleting ? "삭제 중..." : "삭제"}
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

            <Accordion 
              type="single" 
              collapsible 
              className="w-full"
              value={factbook.sections.find((s) => 
                s.subSections.some((ss) => ss.id === activeSection)
              )?.id || factbook.sections[0]?.id}
            >
              {factbook.sections.map((section, idx) => {
                const hasActiveSubSection = section.subSections.some((ss) => ss.id === activeSection)
                return (
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
                )
              })}
            </Accordion>
          </aside>
        )}

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {activeTab === "factbook" ? (
              <div className="max-w-4xl space-y-12">
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
                          <div className="text-slate-700 text-sm leading-relaxed markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-bold text-slate-900 mt-5 mb-3">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-900 mt-4 mb-2">{children}</h3>,
                                h4: ({ children }) => <h4 className="text-base font-semibold text-slate-900 mt-3 mb-2">{children}</h4>,
                                p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-outside mb-4 space-y-2 ml-6 pl-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-outside mb-4 space-y-2 ml-6 pl-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: ({ children, className }) => {
                                  const isInline = !className
                                  return isInline ? (
                                    <code className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                  ) : (
                                    <code className={className}>{children}</code>
                                  )
                                },
                                pre: ({ children }) => (
                                  <pre className="bg-slate-100 border border-slate-300 rounded p-4 overflow-x-auto mb-4">
                                    {children}
                                  </pre>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600">
                                    {children}
                                  </blockquote>
                                ),
                                a: ({ href, children }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                                    {children}
                                  </a>
                                ),
                                table: ({ children }) => (
                                  <div className="overflow-x-auto mb-4 my-6">
                                    <table className="w-full border border-slate-300">
                                      {children}
                                    </table>
                          </div>
                                ),
                                thead: ({ children }) => <thead className="bg-slate-100">{children}</thead>,
                                tbody: ({ children }) => <tbody>{children}</tbody>,
                                tr: ({ children }) => <tr className="border-b border-slate-200">{children}</tr>,
                                th: ({ children }) => (
                                  <th className="border border-slate-300 px-6 py-3 text-left font-semibold text-slate-900">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="border border-slate-300 px-6 py-3">
                                    {children}
                                  </td>
                                ),
                                hr: () => <hr className="my-6 border-slate-300" />,
                              }}
                            >
                              {subSection.content || ""}
                            </ReactMarkdown>
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
              {/* 출처/이미지 탭 */}
              <div className="flex border-b border-slate-300">
                <button
                  onClick={() => setSourceTab("source")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    sourceTab === "source"
                      ? "text-slate-900 border-b-2 border-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  출처
                </button>
                <div className="w-px bg-slate-300"></div>
                <button
                  onClick={() => setSourceTab("image")}
                  className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    sourceTab === "image"
                      ? "text-slate-900 border-b-2 border-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  이미지
                </button>
              </div>

              {/* 탭 내용 */}
              {sourceTab === "source" ? (
                /* 출처 탭 */
                <div>
                  {activeSection && activeSources.filter((s) => !s.imageUrl && s.url).length > 0 ? (
                  <div className="space-y-3">
                      {activeSources
                        .filter((s) => !s.imageUrl && s.url)
                      .map((source, idx) => (
                          <a
                          key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white p-3 rounded border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                          >
                            <p className="font-semibold text-slate-900 text-xs line-clamp-2 mb-2">{source.title || "제목 없음"}</p>
                            {source.content && (
                              <p className="text-slate-600 text-xs line-clamp-2 mb-2">{source.content}</p>
                            )}
                            {source.media && (
                              <p className="text-blue-600 text-xs font-medium">{source.media}</p>
                            )}
                          </a>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">출처 정보가 없습니다.</p>
                )}
              </div>
              ) : (
                /* 이미지 탭 */
                <div>
                  {activeImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {activeImages.map((imageUrl, idx) => {
                        const isFailed = failedImages.has(imageUrl)
                        return (
                          <div
                            key={idx}
                            onClick={() => !isFailed && handleImageClick(imageUrl)}
                            className={`aspect-square bg-slate-200 rounded border border-slate-300 overflow-hidden group relative ${
                              isFailed ? "" : "cursor-pointer hover:opacity-80 transition-opacity"
                            }`}
                          >
                            {isFailed ? (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs text-slate-500">이미지</span>
                              </div>
                            ) : (
                              <img
                                src={imageUrl}
                                alt={`Image ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  setFailedImages((prev) => new Set(prev).add(imageUrl))
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">이미지가 없습니다.</p>
                  )}
                </div>
              )}

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
      {selectedImageIndex !== null && activeImages.length > 0 && (
        <ImageViewer
          images={activeImages}
          currentIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
        />
      )}
    </div>
  )
}
