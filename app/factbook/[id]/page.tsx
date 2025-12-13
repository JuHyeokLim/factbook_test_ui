"use client"

import { useState, useEffect, ReactNode } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUp, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { MediaTab } from "@/components/factbook/media-tab"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ImageViewer } from "@/components/factbook/image-viewer"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { AreaChart, BarChart, Card, DonutChart, LineChart, Text, Title } from "@tremor/react"

interface Source {
  title: string
  content: string
  media: string
  url?: string
  imageUrl?: string
}

interface VisualizationItem {
  id: string
  component: "BarChart" | "LineChart" | "DonutChart" | "AreaChart"
  title?: string
  data?: Record<string, any>[]
  index?: string
  categories?: string[]
  category?: string; // 추가: 백엔드가 단일 카테고리(라벨) 키를 줄 경우 대비
  value?: string;    // 추가: 백엔드가 단일 값 키를 줄 경우 대비
}

interface SubSection {
  id: string
  title: string
  content: string
  visualizations?: VisualizationItem[]
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

// <viz>...</viz> 또는 구(旧) [[VISUALIZATION_DATA]] 블록을 파싱
const visualizationBlockRegex = /<viz>([\s\S]*?)<\/viz>|\[\[VISUALIZATION_DATA\]\]\s*([\s\S]*?)(?:<\/answer>|$)/i
// <think>, <reasoning> 등 다양한 변형 태그 제거
const redactedReasoningRegex = /<(?:redacted_)?(?:reasoning|think)>[\s\S]*?<\/(?:redacted_)?(?:reasoning|think)>/gi
// <answer> ... </answer> 블록만 출력 대상으로 사용
const answerBlockRegex = /<answer>([\s\S]*?)<\/answer>/gi

// [수정] parseVisualizations 함수 전체 교체
const parseVisualizations = (
  rawContent: string
): { cleanedContent: string; visualizations: VisualizationItem[] } => {
  // 1) reasoning/think 제거
  let cleanedContent = rawContent.replace(redactedReasoningRegex, "")

  // 2) answer 블록만 추출
  const answerMatches = [...cleanedContent.matchAll(answerBlockRegex)]
  if (answerMatches.length > 0) {
    cleanedContent = answerMatches.map((m) => m[1]).join("\n\n")
  }
  cleanedContent = cleanedContent.trim()
  
  const match = cleanedContent.match(visualizationBlockRegex)
  let visualizations: VisualizationItem[] = []

  if (match && match[1]) {
    // [중요] 마크다운 코드 블록(```json 등) 제거 로직 추가
    const captured = match[1] || match[2] || ""
    let jsonText = captured.trim()
    jsonText = jsonText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")

    console.log("parseVisualizations: 추출된 JSON 텍스트:", jsonText)
    try {
      const parsed = JSON.parse(jsonText)
      // 배열인지 혹은 객체 내부의 visualizations 배열인지 확인
      const extracted = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as any)?.visualizations)
        ? (parsed as any).visualizations
        : []

      if (Array.isArray(extracted)) {
        visualizations = extracted
          .filter((item) => item && typeof item.id === "string")
          .map((item) => ({
            ...item,
            component: item.component,
          }))
        console.log("parseVisualizations: 파싱된 시각화 데이터:", visualizations)
      }
    } catch (error) {
      console.warn("시각화 JSON 파싱 실패:", error)
    }
  }

  cleanedContent = cleanedContent.replace(visualizationBlockRegex, "").trim()
  return { cleanedContent, visualizations }
}

const numberFormatter = (value: any) => {
  if (value === null || value === undefined) return ""
  if (typeof value === "number") return value.toLocaleString("ko-KR")
  return String(value)
}

const sanitizeVisualizationData = (
  viz: VisualizationItem, 
  indexKey: string, 
  categoryKeys: string[]
): { data: Record<string, any>[]; error?: string; invalidRows?: any[] } => {
  // data가 없으면 빈 배열로 초기화
  const { data = [] } = viz

  if (!data || !data.length) return { error: "데이터가 없습니다.", data: [] }
  if (!indexKey) return { error: "index(라벨) 키를 찾을 수 없습니다.", data: [] }
  if (!categoryKeys || !categoryKeys.length) return { error: "categories(수치) 키를 찾을 수 없습니다.", data: [] }

  const sanitizeNumber = (val: any) => {
    if (typeof val === "number") return val
    if (typeof val === "string") {
      const cleaned = val.replace(/,/g, "").replace(/%/g, "").replace(/[^\d.\-+eE]/g, "")
      if (cleaned.trim() === "") return NaN
      const num = Number(cleaned)
      return Number.isNaN(num) ? NaN : num
    }
    return NaN
  }

  const invalidRows: { row: any; reason: string }[] = []

  const sanitized = data
    .map((row) => {
      // indexKey(라벨) 확인
      if (!(indexKey in row)) {
        invalidRows.push({ row, reason: `index 키 '${indexKey}' 누락` })
        return null
      }
      
      const next = { ...row }
      let valid = true
      
      // categoryKeys(수치) 확인 및 변환
      categoryKeys.forEach((cat) => {
        if (!(cat in next)) {
          valid = false
          invalidRows.push({ row, reason: `category 키 '${cat}' 누락` })
          return
        }
        const num = sanitizeNumber(next[cat])
        if (Number.isNaN(num)) {
          valid = false
          invalidRows.push({ row, reason: `category '${cat}' 숫자 아님` })
        } else {
          next[cat] = num
        }
      })
      return valid ? next : null
    })
    .filter(Boolean) as Record<string, any>[]

  if (!sanitized.length) {
    return { error: "유효한 데이터 행이 없습니다.", data: [], invalidRows }
  }

  return { data: sanitized, invalidRows }
}

// [수정] renderChartComponent 함수: 키 매핑 로직 추가
const renderChartComponent = (viz: VisualizationItem) => {
  if (!viz) return null

  const { id, component, title, data = [], index, categories = [], category, value } = viz
  const chartTitle = title || id

  // 1. 라벨(X축/항목명) 키 결정
  const chartIndex = index || category || "category"

  // 2. 수치(Y축/값) 키 결정
  const chartCategories = (categories && categories.length > 0) 
    ? categories 
    : [value || "value"]

  // 3. 데이터 정제
  const { data: sanitizedData, error: validationError } = sanitizeVisualizationData(
    viz, 
    chartIndex, 
    chartCategories
  )

  const renderFallback = (message: string) => (
    <Card className="border-slate-200 shadow-none">
      <Text className="text-xs text-slate-500">{message}</Text>
    </Card>
  )

  if (!data || data.length === 0) {
    return renderFallback("시각화 데이터가 없어 차트를 표시할 수 없습니다.")
  }

  if (validationError) {
    return renderFallback(`시각화 데이터 오류: ${validationError}`)
  }

  // [수정] 타입스크립트 에러 방지: sanitizedData가 undefined일 경우 빈 배열 할당
  const finalData = sanitizedData || []

  // Tremor v3 DonutChart
  if (component === "DonutChart") {
    const measureKey = chartCategories[0]
    
    return (
      <Card className="border-slate-200 shadow-none">
        <Title className="text-base font-semibold text-slate-900 mb-3">{chartTitle}</Title>
        <DonutChart
          data={finalData}
          category={measureKey}
          index={chartIndex}
          valueFormatter={numberFormatter}
          className="mt-2 h-40"
        />
      </Card>
    )
  }

  // Bar, Line, Area Chart
  const commonProps = {
    data: finalData,
    index: chartIndex,
    categories: chartCategories,
    valueFormatter: numberFormatter,
    className: "mt-2 h-72",
  }

  switch (component) {
    case "BarChart":
      return (
        <Card className="border-slate-200 shadow-none">
          <Title className="text-base font-semibold text-slate-900 mb-3">{chartTitle}</Title>
          <BarChart {...commonProps} />
        </Card>
      )
    case "LineChart":
      return (
        <Card className="border-slate-200 shadow-none">
          <Title className="text-base font-semibold text-slate-900 mb-3">{chartTitle}</Title>
          <LineChart {...commonProps} />
        </Card>
      )
    case "AreaChart":
      return (
        <Card className="border-slate-200 shadow-none">
          <Title className="text-base font-semibold text-slate-900 mb-3">{chartTitle}</Title>
          <AreaChart {...commonProps} />
        </Card>
      )
    default:
      return renderFallback(`${component} 타입 차트가 지원되지 않습니다.`)
  }
}

const createMarkdownComponents = (sources: Source[] = [], onTableCopy?: () => void): Components => ({
  h1: ({ children, ...props }: any) => (
    <h1 {...props} className="text-2xl font-bold text-slate-900 mt-6 mb-4">
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 {...props} className="text-xl font-bold text-slate-900 mt-5 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 {...props} className="text-lg font-semibold text-slate-900 mt-4 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 {...props} className="text-base font-semibold text-slate-900 mt-3 mb-2">
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <p {...props} className="mb-4 leading-relaxed">
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul {...props} className="list-disc list-outside mb-4 space-y-2 ml-6 pl-2">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol {...props} className="list-decimal list-outside mb-4 space-y-2 ml-6 pl-2">
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li {...props} className="mb-2 leading-relaxed">
      {children}
    </li>
  ),
  strong: ({ children, ...props }: any) => (
    <strong {...props} className="font-semibold text-slate-900">
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em {...props} className="italic">
      {children}
    </em>
  ),
  code: ({ children, className, ...props }: any) => {
    const isInline = !className
    return isInline ? (
      <code {...props} className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    ) : (
      <code {...props} className={className}>
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }: any) => (
    <pre {...props} className="bg-slate-100 border border-slate-300 rounded p-4 overflow-x-auto mb-4">
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      {...props}
      className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600"
    >
      {children}
    </blockquote>
  ),
  a: ({ href, children, className, ...props }: any) => {
    const childrenStr = String(children)
    const citationMatch = childrenStr.match(/^CITATION_MARKER_(\d+)$/)
    const isCitation = !!citationMatch
    
    if (isCitation) {
      const citationIndex = parseInt(citationMatch![1], 10) - 1 // 1-based to 0-based
      const source = sources[citationIndex]
      const displayText = `[${citationMatch![1]}]`
      
      if (source) {
        // URL에서 도메인 추출
        const getDomainFromUrl = (url: string) => {
          try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace('www.', '')
          } catch {
            return null
          }
        }
        
        const domain = href ? getDomainFromUrl(href) : null
        const faviconUrl = domain 
          ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
          : null
        
        return (
          <Tooltip delayDuration={0} disableHoverableContent>
            <TooltipTrigger asChild>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 cursor-pointer relative z-10 inline-block"
                style={{ padding: '1px 0', margin: '0 1px' }}
                {...props}
              >
                {displayText}
              </a>
            </TooltipTrigger>
            <TooltipContent 
              className="w-96 p-2 bg-white border border-slate-200 shadow-lg pointer-events-auto" 
              side="top"
              sideOffset={8}
              onPointerDownOutside={(e) => {
                // 다른 출처 링크나 툴팁으로 이동하는 경우 닫지 않음
                const target = e.target as HTMLElement
                if (target.closest('a[href]') || target.closest('[data-radix-tooltip-content]')) {
                  e.preventDefault()
                }
              }}
            >
              <div className="flex items-center gap-2 text-xs">
                {/* 웹사이트 아이콘 */}
                {faviconUrl ? (
                  <img 
                    src={faviconUrl} 
                    alt="" 
                    className="w-4 h-4 flex-shrink-0"
                    onError={(e) => {
                      // favicon 로드 실패 시 기본 아이콘 표시
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <span className="text-slate-400 w-4 h-4 flex-shrink-0">🌐</span>
                )}
                {/* 웹사이트 타이틀 */}
                {source.title && (
                  <>
                    <span className="font-medium text-slate-900 truncate flex-1 min-w-0">{source.title}</span>
                    <span className="text-slate-300 flex-shrink-0">|</span>
                  </>
                )}
                {/* URL */}
                {href && (
                  <span className="text-slate-500 truncate flex-1 min-w-0">{href}</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )
      }
    }
    
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
        {...props}
      >
        {children}
      </a>
    )
  },
  table: ({ children, ...props }: any) => {
    const [isHovered, setIsHovered] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    
    const handleCopyTable = async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      try {
        // 표를 텍스트로 변환
        const table = e.currentTarget.closest('div')?.querySelector('table')
        if (!table) return
        
        let text = ''
        const rows = table.querySelectorAll('tr')
        
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll('th, td')
          const rowText = Array.from(cells).map(cell => {
            return cell.textContent?.trim() || ''
          }).join('\t')
          text += rowText + '\n'
        })
        
        // 클립보드에 복사
        await navigator.clipboard.writeText(text.trim())
        setIsCopied(true)
        onTableCopy?.()
        
        // 2초 후 복사 상태 초기화
        setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      } catch (error) {
        console.error('표 복사 실패:', error)
      }
    }
    
    return (
      <div 
        className="relative overflow-x-auto mb-4 my-6 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <table {...props} className="w-full border border-slate-300">
          {children}
        </table>
        {isHovered && (
          <button
            onClick={handleCopyTable}
            className="absolute top-2 right-2 z-10 p-2 bg-white border border-slate-300 rounded-md shadow-md hover:bg-slate-50 transition-all flex items-center justify-center"
            title="표 복사"
          >
            {isCopied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}
      </div>
    )
  },
  thead: ({ children, ...props }: any) => (
    <thead {...props} className="bg-slate-100">
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }: any) => (
    <tr {...props} className="border-b border-slate-200">
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th {...props} className="border border-slate-300 px-6 py-3 text-left font-semibold text-slate-900">
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td {...props} className="border border-slate-300 px-6 py-3">
      {children}
    </td>
  ),
  hr: () => <hr className="my-6 border-slate-300" />,
})

export default function FactbookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [factbook, setFactbook] = useState<FactbookDetail | null>(null)
  const [activeSection, setActiveSection] = useState<string>("")
  const [expandedSection, setExpandedSection] = useState<string | undefined>(undefined) // Accordion에서 열린 섹션
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
            // 백엔드 데이터 키값 확인 (sub_sections 우선 체크)
            const rawSubSections = section.subSections || section.sub_sections || [];
  
            const subSectionsWithSources = rawSubSections.map((subSection: any) => {
              const { cleanedContent, visualizations } = parseVisualizations(subSection.content || "")
              const rawSources = subSection.sources || subSection.source_list || [];
              return {
              id: subSection.id || "",
              title: subSection.title || "",
                content: cleanedContent,
                visualizations,
              sources: (subSection.sources || []).map((source: any) => ({
                title: source.title || "",
                content: source.content || "",
                media: source.media || "",
                url: source.url || "",
                imageUrl: source.imageUrl || undefined,
              })),
              }
            })

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
          const firstSubSectionId = factbook.sections[0].subSections[0].id
          setActiveSection(firstSubSectionId)
          setExpandedSection(factbook.sections[0].id) // 첫 번째 섹션 열기
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

  // activeSection이 변경될 때 해당 섹션이 자동으로 열리도록
  useEffect(() => {
    if (!factbook) return
    
    const currentSection = factbook.sections.find((s) => 
      s.subSections.some((ss) => ss.id === activeSection)
    )
    
    if (currentSection) {
      setExpandedSection(currentSection.id)
    }
  }, [activeSection, factbook])

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

  const handleTableCopy = () => {
    toast({
      title: "표가 복사되었습니다.",
      duration: 2000,
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

  // 본문의 [숫자] 패턴을 출처 URL 링크로 변환 (마크다운 링크 형식)
  const convertCitationLinks = (content: string, sources: Source[] = []): string => {
    if (!sources || sources.length === 0) {
      return content
    }

    // [숫자] 패턴을 찾아서 마크다운 링크로 변환
    // 링크 텍스트에 [1]을 표시하기 위해 특수 마커 사용
    // 예: [1] -> [CITATION_MARKER_1](url1)
    return content.replace(/\[(\d+)\]/g, (match, numStr) => {
      const index = parseInt(numStr, 10) - 1 // 1-based to 0-based
      if (index >= 0 && index < sources.length && sources[index]?.url) {
        const url = sources[index].url!
        // 특수 마커를 사용하여 나중에 컴포넌트에서 [1]로 변환
        return `[CITATION_MARKER_${numStr}](${url})`
      }
      // URL이 없으면 원본 유지
      return match
    })
  }

  const renderContentWithCharts = (subSection: SubSection) => {
    const content = subSection.content || ""
    const visualizations = subSection.visualizations || []
    const sources = subSection.sources || []
    const regex = /\{\{([A-Z0-9_]+)\}\}/g
    const nodes: ReactNode[] = []
    const usedChartIds = new Set<string>()
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      const textSegment = content.slice(lastIndex, match.index)
      if (textSegment.trim()) {
        nodes.push(
          <ReactMarkdown
            key={`md-${subSection.id}-${match.index}`}
            remarkPlugins={[remarkGfm]}
            components={createMarkdownComponents(sources, handleTableCopy)}
          >
            {convertCitationLinks(textSegment, sources)}
          </ReactMarkdown>
        )
      }

      const chartId = match[1]
      const viz = visualizations.find((v) => v.id === chartId)
      if (viz) {
        usedChartIds.add(chartId)
      }
      nodes.push(
        <div key={`chart-${subSection.id}-${chartId}-${match.index}`} className="my-4">
          {viz ? (
            <>
              {console.log("renderContentWithCharts: renderChartComponent 호출, viz:", viz)}
              {renderChartComponent(viz)}
            </>
          ) : (
            <div className="text-xs text-slate-500 italic border border-dashed border-slate-300 rounded p-3">
              {`시각화 데이터(${chartId})를 찾을 수 없습니다.`}
            </div>
          )}
        </div>
      )

      lastIndex = regex.lastIndex
    }

    const remaining = content.slice(lastIndex)
    if (remaining.trim() || nodes.length === 0) {
      nodes.push(
        <ReactMarkdown
          key={`md-${subSection.id}-last`}
          remarkPlugins={[remarkGfm]}
          components={createMarkdownComponents(sources)}
        >
          {convertCitationLinks(remaining, sources)}
        </ReactMarkdown>
      )
    }

    // 만약 본문에 {{CHART_ID}}를 넣지 않아도, 응답 JSON에 있는 차트를 모두 노출
    const unusedVisualizations = visualizations.filter((viz) => !usedChartIds.has(viz.id))
    if (unusedVisualizations.length > 0) {
      unusedVisualizations.forEach((viz) => {
        nodes.push(
          <div key={`chart-${subSection.id}-${viz.id}-fallback`} className="my-4">
            {renderChartComponent(viz)}
          </div>
        )
      })
    }

    return <div className="space-y-4">{nodes}</div>
  }

  const handleSubSectionClick = (subSectionId: string) => {
    setActiveSection(subSectionId)
    // 섹션 변경 시 이미지 뷰어 닫기
    setSelectedImageIndex(null)
    // 수동 스크롤 시작
    setIsManualScroll(true)
    const element = document.getElementById(`section-${subSectionId}`)
    if (element) {
      // 스크롤 인터랙션 없이 바로 이동
      element.scrollIntoView({ behavior: "auto", block: "start" })
    }
  }

  const handleSectionClick = (sectionId: string) => {
    // 해당 섹션의 첫 번째 subSection으로 이동
    const section = factbook?.sections.find((s) => s.id === sectionId)
    if (section && section.subSections.length > 0) {
      handleSubSectionClick(section.subSections[0].id)
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
    <TooltipProvider delayDuration={0} skipDelayDuration={2000}>
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
              value={expandedSection}
              onValueChange={setExpandedSection}
            >
              {factbook.sections.map((section, idx) => {
                const hasActiveSubSection = section.subSections.some((ss) => ss.id === activeSection)
                const isExpanded = expandedSection === section.id
                return (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionPrimitive.Header className="flex">
                    <button
                      onClick={() => handleSectionClick(section.id)}
                      className="flex flex-1 items-center text-left text-sm font-medium text-slate-900 py-2 hover:underline"
                    >
                      {idx + 1}. {section.title}
                    </button>
                    <AccordionPrimitive.Trigger
                      className="flex items-center justify-center p-2 hover:bg-slate-100 rounded transition-all [&[data-state=open]>svg]:rotate-180"
                      onClick={(e) => {
                        // 화살표 버튼 클릭 시에만 토글
                        e.stopPropagation()
                      }}
                    >
                      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
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
                            {renderContentWithCharts(subSection)}
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
                      .map((source, idx) => {
                          // URL에서 도메인 추출
                          const getDomainFromUrl = (url: string) => {
                            try {
                              const urlObj = new URL(url)
                              return urlObj.hostname.replace('www.', '')
                            } catch {
                              return null
                            }
                          }
                          
                          const domain = source.url ? getDomainFromUrl(source.url) : null
                          const faviconUrl = domain 
                            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
                            : null
                          
                          return (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-white p-3 rounded border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            >
                              {/* 아이콘 | 제목 (최대 2줄) */}
                              <div className="flex items-start gap-2 text-xs mb-2">
                                {/* 웹사이트 아이콘 */}
                                {faviconUrl ? (
                                  <img 
                                    src={faviconUrl} 
                                    alt="" 
                                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <span className="text-slate-400 w-4 h-4 flex-shrink-0 mt-0.5">🌐</span>
                                )}
                                {/* 웹사이트 타이틀 */}
                                {source.title && (
                                  <span className="font-semibold text-slate-900 line-clamp-2 flex-1 min-w-0">{source.title}</span>
                                )}
                              </div>
                              {/* URL (최대 2줄) */}
                              {source.url && (
                                <p className="text-slate-600 text-xs line-clamp-2">{source.url}</p>
                              )}
                            </a>
                          )
                        })}
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
    </TooltipProvider>
  )
}
