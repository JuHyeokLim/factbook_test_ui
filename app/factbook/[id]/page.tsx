"use client"

import { useState, useEffect, useRef, ReactNode, createContext, useContext, memo, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowUp, Copy, Check, Download, FileSearch, Folder, Link2, Image as ImageIcon, Search, Building2, Globe, Star, Target, Tv, ExternalLink, ZoomIn, ZoomOut, RotateCcw, FileText, FilePieChart, FileSpreadsheet, Trash2, MoreVertical } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { MediaTab } from "@/components/factbook/media-tab"
import { RecommendationBar } from "@/components/factbook/recommendation-bar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ImageViewer } from "@/components/factbook/image-viewer"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { AreaChart, BarChart, Card, DonutChart, LineChart, Text, Title, Legend } from "@tremor/react"
import { exportFactbookToWord } from "@/lib/exportUtils"
import { toJpeg, toSvg } from 'html-to-image'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Source {
  title: string
  content: string
  media: string
  url?: string
  imageUrl?: string
}

interface ProductServiceItem {
  id: string
  product_name: string
  competitors: string[]
  proposals: string[]
  target_customers: string[]
}

interface ReferenceMaterial {
  id: string
  type: "file" | "link" | "text"
  name: string
  url?: string
  content?: string
  file_size?: number
  content_type?: string
}

type FactbookTab = "factbook" | "links" | "images" | "media" | "files";

// 출처 정보 전달을 위한 Context
const SourcesContext = createContext<Source[]>([])

// --- 마크다운용 커스텀 컴포넌트들 (메인 컴포넌트 외부에 정의하여 리마운트 방지) ---

const MarkdownTable = memo(({ children, onTableCopy, ...props }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  
  const handleCopyTable = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const container = e.currentTarget.closest('.group') || e.currentTarget.parentElement?.parentElement;
      const table = container?.querySelector('table')
      
      if (!table) return
      
      let text = ''
      const rows = Array.from(table.querySelectorAll('tr'))
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        const rowText = cells.map(cell => cell.textContent?.trim() || '').join('\t')
        if (rowText) text += rowText + '\n'
      })
      
      if (!text.trim()) return

      await navigator.clipboard.writeText(text.trim())
      setIsCopied(true)
      if (onTableCopy) onTableCopy()
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('표 복사 실패:', error)
    }
  }

  const handleDownloadCSV = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const container = e.currentTarget.closest('.group') || e.currentTarget.parentElement?.parentElement;
    const table = container?.querySelector('table')
    if (!table) return
    
    let csv = '\uFEFF'
    const rows = Array.from(table.querySelectorAll('tr'))
    rows.forEach((row) => {
      const cells = Array.from(row.querySelectorAll('th, td'))
      const rowText = cells
        .map(cell => `"${cell.textContent?.trim().replace(/"/g, '""') || ''}"`)
        .join(',')
      csv += rowText + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `table_data_${new Date().getTime()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div 
      className="relative overflow-hidden mb-6 my-6 group bg-white border border-slate-200 rounded-xl shadow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="overflow-x-auto">
        <table {...props} className="w-full border-collapse">
          {children}
        </table>
      </div>
      
      <div className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopyTable}
              className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] px-2 py-1">{isCopied ? "복사 완료" : "표 복사"}</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] px-2 py-1">CSV 다운로드</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
})

const MarkdownImg = memo(({ src, alt, onImageClick }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleDownloadImage = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!src) return
    
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      const urlParts = src.split("/")
      let fileName = urlParts[urlParts.length - 1]?.split("?")[0] || "image.jpg"
      if (!fileName.includes(".")) fileName += ".jpg"
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      window.open(src, "_blank")
    }
  }

  return (
    <div 
      className="relative inline-block my-4 group overflow-hidden rounded-xl border border-slate-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={src} 
        alt={alt} 
        className="max-w-full h-auto cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]" 
        onClick={() => src && onImageClick?.(src)} 
      />
      
      <div className={`absolute top-2 right-2 z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm hover:bg-white text-[11px] font-bold text-slate-600 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              JPG
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] px-2 py-1">JPG 다운로드</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
})

const MarkdownLink = memo(({ href, children, ...props }: any) => {
  const sources = useContext(SourcesContext)
  const childrenStr = String(children)
  const groupMatch = childrenStr.match(/^CITATION_GROUP_(.+)$/)
  
  if (groupMatch) {
    const indexStrings = groupMatch[1].split("_")
    const indices = indexStrings.map(s => parseInt(s, 10))
    const firstIndex = indices[0]
    const firstSource = sources[firstIndex - 1]
    
    if (firstSource) {
      const getDomainFromUrl = (url?: string) => {
        if (!url) return null
        try {
          const urlObj = new URL(url)
          return urlObj.hostname.replace("www.", "")
        } catch { return null }
      }

      const domain = getDomainFromUrl(firstSource.url) || "출처"
      const displayText = indices.length > 1 ? `${domain} +${indices.length - 1}` : domain

      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-[#F1F5F9] text-[#64748B] px-2 py-0 h-5 border-0 m-0 ml-1 rounded-md text-[9px] font-semibold hover:bg-[#E2E8F0] transition-colors cursor-pointer relative z-10 align-middle mb-0.5"
              {...props}
            >
              {displayText}
            </a>
          </TooltipTrigger>
          <TooltipContent className="w-80 p-0 bg-white border border-slate-200 shadow-lg pointer-events-auto overflow-hidden" side="top" sideOffset={4}>
            <div className="max-h-60 overflow-y-auto">
              {indices.map((idx, i) => {
                const s = sources[idx - 1]
                if (!s) return null
                const domain = getDomainFromUrl(s.url)
                const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null
                return (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group">
                    {faviconUrl ? <img src={faviconUrl} alt="" className="w-4 h-4 flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none' }} /> : <span className="text-slate-400 w-4 h-4 flex-shrink-0 text-[10px]">🌐</span>}
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-slate-900 truncate group-hover:text-blue-600">{s.title || "제목 없음"}</div>
                      {s.url && <div className="text-[10px] text-slate-500 truncate">{s.url}</div>}
                    </div>
                  </a>
                )
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      )
    }
  }
  
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800" {...props}>
      {children}
    </a>
  )
})

MarkdownTable.displayName = 'MarkdownTable'
MarkdownImg.displayName = 'MarkdownImg'
MarkdownLink.displayName = 'MarkdownLink'

// -----------------------------------------------------------------------------------


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
  colors?: string[]; // 추가: Tremor 차트 색상 배열
}

interface SubSection {
  id: string
  title: string
  content: string
  visualizations?: VisualizationItem[]
  sources?: Source[] // subSection 레벨에 sources 추가
  related_questions?: string[] // 관련 질문 추가
}

interface Section {
  id: string
  type: string // section_type (company, market, ownCompany, competitor, target)
  title: string
  subSections: SubSection[]
  sources?: Source[] // 선택적으로 유지 (계산용)
}

interface FactbookDetail {
  id: string
  companyName: string
  productName: string
  category: string
  status: string // draft, generating, completed, failed, queued
  sections: Section[]
  analysisItems?: {
    media?: boolean
  }
  referenceLinks?: { title: string; url: string }[]
  items: ProductServiceItem[]
  references: ReferenceMaterial[]
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
  // 1) 먼저 원본 content에서 viz 블록 추출 (answer 태그 안팎 모두 처리 가능)
  const vizMatch = rawContent.match(visualizationBlockRegex)
  let visualizations: VisualizationItem[] = []

  if (vizMatch && (vizMatch[1] || vizMatch[2])) {
    // [중요] 마크다운 코드 블록(```json 등) 제거 로직 추가
    const captured = vizMatch[1] || vizMatch[2] || ""
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

  // 2) reasoning/think 제거
  let cleanedContent = rawContent.replace(redactedReasoningRegex, "")

  // 3) answer 블록만 추출
  const answerMatches = [...cleanedContent.matchAll(answerBlockRegex)]
  if (answerMatches.length > 0) {
    cleanedContent = answerMatches.map((m) => m[1]).join("\n\n")
  }
  cleanedContent = cleanedContent.trim()

  // 4) viz 블록 제거
  cleanedContent = cleanedContent.replace(visualizationBlockRegex, "").trim()
  
  // 5) 남아있는 커스텀 태그들 제거 (안전장치)
  cleanedContent = cleanedContent.replace(/<\/?answer>/gi, "")
  cleanedContent = cleanedContent.replace(/<\/?think>/gi, "")
  cleanedContent = cleanedContent.replace(/<\/?reasoning>/gi, "")
  cleanedContent = cleanedContent.trim()
  
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

const ChartWrapper = ({ children, title, viz, sources }: { children: React.ReactNode, title: string, viz?: VisualizationItem, sources?: Source[] }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleDownload = async (format: 'jpg' | 'svg') => {
    if (!chartRef.current) return
    try {
      // [수정] 애니메이션이 완전히 끝나고 스타일이 확정되도록 대기 시간을 늘립니다.
      await new Promise(resolve => setTimeout(resolve, 800));

      // [추가] SVG 요소들의 스타일을 인라인으로 강제 변환하여 검정색 방지 및 PPT 호환성 향상
      const svgElements = chartRef.current.querySelectorAll('svg');
      svgElements.forEach((svg) => {
        // PPT 호환성을 위한 네임스페이스 추가
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        const allElements = svg.querySelectorAll('*');
        allElements.forEach((el) => {
          const computedStyle = window.getComputedStyle(el);
          
          // PPT에서 렌더링에 필요한 핵심 스타일 속성들을 인라인으로 주입
          const styleProps = [
            'fill', 
            'stroke', 
            'stroke-width', 
            'font-family', 
            'font-size', 
            'font-weight',
            'opacity',
            'display',
            'visibility'
          ];

          styleProps.forEach(prop => {
            const value = computedStyle.getPropertyValue(prop);
            if (value && value !== 'none' && !value.includes('url')) {
              (el as HTMLElement).style.setProperty(prop, value);
            }
          });
        });
      });

      const filter = (node: HTMLElement) => {
        if (node.classList?.contains('recharts-tooltip-wrapper')) return false;
        if (node.classList?.contains('absolute') && node.classList?.contains('right-4')) return false;
        return true;
      }

      const options = { 
        backgroundColor: '#ffffff', 
        filter, 
        pixelRatio: 3, // 고화질을 위해 3으로 상향
        style: {
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        },
        cacheBust: true,
      }

      let dataUrl = ''
      if (format === 'jpg') {
        dataUrl = await toJpeg(chartRef.current, options)
      } else {
        dataUrl = await toSvg(chartRef.current, options)
      }
      
      const link = document.createElement('a')
      link.download = `${title.replace(/\s+/g, '_')}_chart.${format}`
      link.href = dataUrl
      link.click()

      // [추가] 인라인 스타일 원상복구 (화면 렌더링에 영향 주지 않기 위함)
      svgElements.forEach((svg) => {
        const allElements = svg.querySelectorAll('*');
        allElements.forEach((el) => {
          (el as HTMLElement).style.fill = '';
          (el as HTMLElement).style.stroke = '';
          (el as HTMLElement).style.strokeWidth = '';
          (el as HTMLElement).style.fontFamily = '';
          (el as HTMLElement).style.fontSize = '';
          (el as HTMLElement).style.fontWeight = '';
          (el as HTMLElement).style.opacity = '';
        });
      });
    } catch (err) {
      console.error('차트 다운로드 실패:', err)
    }
  }

  return (
    <div className="relative border border-slate-200 shadow-sm rounded-xl p-6 bg-white overflow-visible group mb-6 my-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      <div className={`absolute top-4 right-4 z-10 flex gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button onClick={() => handleDownload('jpg')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-all">
              <Download className="w-3.5 h-3.5" /> JPG
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] px-2 py-1">JPG 다운로드</TooltipContent>
        </Tooltip>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button onClick={() => handleDownload('svg')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-all">
              <Download className="w-3.5 h-3.5" /> SVG
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-[10px] px-2 py-1">SVG 다운로드</TooltipContent>
        </Tooltip>
      </div>
      <div ref={chartRef} className="bg-white chart-tooltip-container">
        <div className="flex justify-center mb-4">
          <Title className="text-lg font-bold text-[#4D5D71]">{title}</Title>
        </div>
        {children}
        
        {/* 차트 하단 출처 표시 */}
        {viz && sources && sources.length > 0 && (() => {
          // viz.data에서 모든 _출처 필드를 찾아서 출처 번호 추출
          const sourceNumbers = new Set<number>()
          if (viz.data && Array.isArray(viz.data)) {
            viz.data.forEach((row: any) => {
              Object.keys(row).forEach(key => {
                if (key.endsWith('_출처')) {
                  const matches = String(row[key]).match(/\[(\d+)\]/g)
                  if (matches) {
                    matches.forEach(match => {
                      const num = parseInt(match.replace(/[\[\]]/g, ""), 10)
                      if (num > 0 && num <= sources.length) {
                        sourceNumbers.add(num)
                      }
                    })
                  }
                }
              })
            })
          }
          
          const uniqueSources = Array.from(sourceNumbers).sort((a, b) => a - b).map(num => sources[num - 1]).filter(Boolean)
          
          if (uniqueSources.length === 0) return null
          
          return (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-600 mb-2">참고 출처</p>
              <div className="space-y-1">
                {uniqueSources.map((source, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-400 shrink-0">[{Array.from(sourceNumbers).sort((a, b) => a - b)[idx]}]</span>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1 truncate" title={source.title}>
                        {source.title || source.url}
                      </a>
                    ) : (
                      <span className="text-slate-600 flex-1 truncate">{source.title}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

const ChartRenderer = ({ viz, sources }: { viz: VisualizationItem, sources?: Source[] }) => {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  
  if (!viz) return null
  const { id, component, title, data = [], index, categories = [], category, value, colors } = viz
  const chartTitle = title || id
  const chartIndex = index || category || "category"
  const chartCategories = (categories && categories.length > 0) ? categories : [value || "value"]
  const { data: sanitizedData, error: validationError } = sanitizeVisualizationData(viz, chartIndex, chartCategories)

  const handleLegendClick = (name: string) => {
    setActiveCategory(prev => prev === name ? undefined : name)
  }

  const customTooltip = ({ payload, active }: any) => {
    if (!active || !payload || payload.length === 0) return null
    const data = payload[0].payload
    if (component === "DonutChart") {
      const categoryValue = data[chartIndex]
      const measureKey = chartCategories[0]
      const measureValue = data[measureKey]
      return (
        <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-3 max-w-xs">
          <p className="font-semibold text-slate-900 mb-2 text-sm">{categoryValue}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-slate-700 text-xs">{measureKey}:</span>
            <span className="font-semibold text-slate-900 text-sm">{numberFormatter(measureValue)}</span>
          </div>
        </div>
      )
    }
    return (
      <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-3 max-w-xs">
        <p className="font-semibold text-slate-900 mb-2 text-sm">{data[chartIndex]}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, idx: number) => {
            const categoryName = entry.name
            const categoryValue = entry.value
            return (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-700 text-xs">{categoryName}:</span>
                    <span className="font-semibold text-slate-900 text-sm">{numberFormatter(categoryValue)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderFallback = (message: string) => (
    <div className="border border-slate-200 shadow-sm rounded-xl p-6 bg-white mb-6 my-6">
      <Text className="text-xs text-slate-500">{message}</Text>
    </div>
  )
  if (!data || data.length === 0) return renderFallback("시각화 데이터가 없어 차트를 표시할 수 없습니다.")
  if (validationError) return renderFallback(`시각화 데이터 오류: ${validationError}`)
  const finalData = sanitizedData || []

  const chartColors = colors && colors.length > 0 ? colors : ["blue", "emerald", "violet", "amber", "gray", "cyan", "pink", "indigo"]

  if (component === "DonutChart") {
    const measureKey = chartCategories[0]
    const donutLegendCategories = finalData.map(item => item[chartIndex])
    
    // 선택된 항목만 강조하는 색상 배열 생성
    const displayColors = activeCategory 
      ? finalData.map((item, idx) => item[chartIndex] === activeCategory ? chartColors[idx % chartColors.length] : "gray")
      : chartColors

    return (
      <ChartWrapper title={chartTitle} viz={viz} sources={sources}>
        <div className="flex justify-center mb-6">
          <Legend 
            categories={donutLegendCategories} 
            colors={chartColors} 
            className="flex-wrap justify-center gap-x-6 gap-y-3"
            activeLegend={activeCategory}
            onClickLegendItem={handleLegendClick}
          />
        </div>
        <DonutChart 
          data={finalData} 
          category={measureKey} 
          index={chartIndex} 
          valueFormatter={numberFormatter} 
          colors={displayColors} 
          className="mt-2 h-48" 
          customTooltip={customTooltip}
        />
      </ChartWrapper>
    )
  }

  // Bar, Line, Area Chart용 강조 색상
  const displayColors = activeCategory
    ? chartCategories.map((cat, idx) => cat === activeCategory ? chartColors[idx % chartColors.length] : "gray")
    : chartColors

  const commonProps = {
    data: finalData,
    index: chartIndex,
    categories: chartCategories,
    valueFormatter: numberFormatter,
    className: "mt-4 h-72 pr-4",
    customTooltip: customTooltip,
    yAxisWidth: 80,
  }

  switch (component) {
    case "BarChart": 
      return (
        <ChartWrapper title={chartTitle} viz={viz} sources={sources}>
          <div className="flex justify-end mb-4">
            <Legend 
              categories={chartCategories} 
              colors={chartColors} 
              className="flex-wrap justify-end gap-x-6 gap-y-3"
              activeLegend={activeCategory}
              onClickLegendItem={handleLegendClick}
            />
          </div>
          <BarChart {...commonProps} colors={displayColors} showLegend={false} />
        </ChartWrapper>
      )
    case "LineChart": 
      return (
        <ChartWrapper title={chartTitle} viz={viz} sources={sources}>
          <div className="flex justify-end mb-4">
            <Legend 
              categories={chartCategories} 
              colors={chartColors} 
              className="flex-wrap justify-end gap-x-6 gap-y-3"
              activeLegend={activeCategory}
              onClickLegendItem={handleLegendClick}
            />
          </div>
          <LineChart {...commonProps} colors={displayColors} showLegend={false} />
        </ChartWrapper>
      )
    case "AreaChart": 
      return (
        <ChartWrapper title={chartTitle} viz={viz} sources={sources}>
          <div className="flex justify-end mb-4">
            <Legend 
              categories={chartCategories} 
              colors={chartColors} 
              className="flex-wrap justify-end gap-x-6 gap-y-3"
              activeLegend={activeCategory}
              onClickLegendItem={handleLegendClick}
            />
          </div>
          <AreaChart {...commonProps} colors={displayColors} showLegend={false} />
        </ChartWrapper>
      )
    default: return renderFallback(`${component} 타입 차트가 지원되지 않습니다.`)
  }
}

const renderChartComponent = (viz: VisualizationItem, sources?: Source[]) => {
  return <ChartRenderer viz={viz} sources={sources} />
}

const createMarkdownComponents = (
  sources: Source[] = [], 
  onTableCopy?: () => void,
  onImageClick?: (src: string) => void
): Components => ({
  h1: ({ children, ...props }: any) => (
    <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">
      {children}
    </h3>
  ),
  h2: ({ children, ...props }: any) => (
    <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">
      {children}
    </h3>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 {...props} className="text-base font-bold text-[#354355] mt-3 mb-1">
      {children}
    </h4>
  ),
  p: ({ children, ...props }: any) => (
    <div {...props} className="mb-2 leading-6 font-medium text-[#334155] text-sm">
      {children}
    </div>
  ),
  ul: ({ children, ...props }: any) => (
    <ul {...props} className="list-disc font-medium list-outside mb-4 space-y-1 ml-5">
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol {...props} className="list-decimal font-medium list-outside mb-4 space-y-1 ml-5">
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li {...props} className="leading-6 font-medium text-[#334155] text-sm">
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
  img: ({ src, alt }: any) => {
    const [isHovered, setIsHovered] = useState(false)
    
    const handleDownloadImage = async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!src) return
      
      try {
        const response = await fetch(src)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        
        const urlParts = src.split("/")
        let fileName = urlParts[urlParts.length - 1]?.split("?")[0] || "image.jpg"
        if (!fileName.includes(".")) fileName += ".jpg"
        
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("이미지 다운로드 실패:", error)
        window.open(src, "_blank")
      }
    }

    return (
      <div 
        className="relative inline-block my-4 group overflow-hidden rounded-xl border border-slate-200"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full h-auto cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]" 
          onClick={() => src && onImageClick?.(src)} 
        />
        
        <div className={`absolute top-2 right-2 z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleDownloadImage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm hover:bg-white text-[11px] font-bold text-slate-600 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                JPG
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] px-2 py-1">
              JPG 다운로드
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  },
  a: ({ href, children, className, ...props }: any) => {
    const childrenStr = String(children)
    const groupMatch = childrenStr.match(/^CITATION_GROUP_(.+)$/)
    
    if (groupMatch) {
      const indexStrings = groupMatch[1].split("_")
      const indices = indexStrings.map(s => parseInt(s, 10))
      const firstIndex = indices[0]
      const firstSource = sources[firstIndex - 1]
      
      if (firstSource) {
        // 도메인 추출 함수
        const getDomainFromUrl = (url?: string) => {
          if (!url) return null
          try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace("www.", "")
          } catch { return null }
        }

        // 표시 텍스트 결정: "도메인 +N"
        const domain = getDomainFromUrl(firstSource.url) || "출처"
        const displayText = indices.length > 1 
          ? `${domain} +${indices.length - 1}`
          : domain

        return (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-[#F1F5F9] text-[#64748B] px-2 py-0 h-5 border-0 m-0 ml-1 rounded-md text-[9px] font-semibold hover:bg-[#E2E8F0] transition-colors cursor-pointer relative z-10 align-middle mb-0.5"
                {...props}
              >
                {displayText}
              </a>
            </TooltipTrigger>
            <TooltipContent 
              className="w-80 p-0 bg-white border border-slate-200 shadow-lg pointer-events-auto overflow-hidden" 
              side="top"
              sideOffset={4}
            >
              <div className="max-h-60 overflow-y-auto">
                {indices.map((idx, i) => {
                  const s = sources[idx - 1]
                  if (!s) return null
                  
                  const getDomainFromUrl = (url?: string) => {
                    if (!url) return null
                    try {
                      const urlObj = new URL(url)
                      return urlObj.hostname.replace("www.", "")
                    } catch { return null }
                  }
                  const domain = getDomainFromUrl(s.url)
                  const faviconUrl = domain 
                    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
                    : null

                  return (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group"
                    >
                      {faviconUrl ? (
                        <img 
                          src={faviconUrl} 
                          alt="" 
                          className="w-4 h-4 flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <span className="text-slate-400 w-4 h-4 flex-shrink-0 text-[10px]">🌐</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-900 truncate group-hover:text-blue-600">
                          {s.title || "제목 없음"}
                        </div>
                        {s.url && (
                          <div className="text-[10px] text-slate-500 truncate">{s.url}</div>
                        )}
                      </div>
                    </a>
                  )
                })}
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
        // [수정] 더 확실하게 테이블 요소를 찾기 위해 상위 컨테이너에서 쿼리합니다.
        const container = e.currentTarget.closest('.group') || e.currentTarget.parentElement?.parentElement;
        const table = container?.querySelector('table')
        
        if (!table) {
          console.error('복사할 테이블을 찾을 수 없습니다.');
          return
        }
        
        let text = ''
        const rows = Array.from(table.querySelectorAll('tr'))
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll('th, td'))
          const rowText = cells.map(cell => cell.textContent?.trim() || '').join('\t')
          if (rowText) text += rowText + '\n'
        })
        
        if (!text.trim()) return;

        await navigator.clipboard.writeText(text.trim())
        setIsCopied(true)
        if (onTableCopy) onTableCopy()
        setTimeout(() => setIsCopied(false), 2000)
      } catch (error) {
        console.error('표 복사 실패:', error)
      }
    }

    const handleDownloadCSV = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      const container = e.currentTarget.closest('.group') || e.currentTarget.parentElement?.parentElement;
      const table = container?.querySelector('table')
      if (!table) return
      
      let csv = '\uFEFF' // Excel용 BOM
      const rows = Array.from(table.querySelectorAll('tr'))
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'))
        const rowText = cells
          .map(cell => `"${cell.textContent?.trim().replace(/"/g, '""') || ''}"`)
          .join(',')
        csv += rowText + '\n'
      })
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `table_data_${new Date().getTime()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
    
    return (
      <div 
        className="relative overflow-hidden mb-6 my-6 group bg-white border border-slate-200 rounded-xl shadow-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="overflow-x-auto">
          <table {...props} className="w-full border-collapse">
            {children}
          </table>
        </div>
        
        {/* 버튼 그룹 (호버 시 노출) */}
        <div className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopyTable}
                className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] px-2 py-1">
              {isCopied ? "복사 완료" : "표 복사"}
            </TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={handleDownloadCSV}
                className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center"
              >
                <Download className="w-4 h-4 text-slate-600" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[10px] px-2 py-1">
              CSV 다운로드
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    )
  },
  thead: ({ children, ...props }: any) => (
    <thead {...props} className="bg-[#f8fafc]">
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => <tbody {...props} className="bg-white">{children}</tbody>,
  tr: ({ children, ...props }: any) => (
    <tr {...props} className="border-b border-slate-100 last:border-0">
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th {...props} className="px-6 py-3 text-left text-xs font-bold text-[#4D5D71] border-r border-slate-100 last:border-0">
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td {...props} className="px-6 py-3 text-sm text-[#334155] border-r border-slate-100 last:border-0 font-medium">
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
  const [activeTab, setActiveTab] = useState<FactbookTab>("factbook")
  const [sourceTab, setSourceTab] = useState<"source" | "image">("source") // 출처/이미지 탭 (기존 사이드바용, 유지)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set()) // 로드 실패한 이미지 URL 저장
  const [isManualScroll, setIsManualScroll] = useState(false) // 수동 스크롤 여부
  const [isDeleting, setIsDeleting] = useState(false)
  const [isInputInfoOpen, setIsInputInfoOpen] = useState(false)
  
  // ✅ 전역 항목 추가 상태 (모든 섹션에서 공유)
  const [isAddingItem, setIsAddingItem] = useState(false) // 어딘가에서 항목 추가 중인지
  const [addingSection, setAddingSection] = useState<string | null>(null) // 어느 섹션에서 추가 중인지
  
  const mainContentRef = useRef<HTMLDivElement>(null) // 메인 콘텐츠 스크롤 컨테이너 ref
  const { toast } = useToast()

  // 상단 탭 인디케이터 제어
  const navTabsRef = useRef<(HTMLButtonElement | null)[]>([])
  const [navIndicatorStyle, setNavIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 })

  const updateNavIndicator = useCallback(() => {
    const tabIndices: Record<string, number> = {
      factbook: 0,
      files: 1,
      links: 2,
      images: 3,
    }
    
    const index = tabIndices[activeTab]
    if (index !== undefined && navTabsRef.current[index]) {
      const element = navTabsRef.current[index]
      if (element) {
        setNavIndicatorStyle({
          left: element.offsetLeft,
          width: element.offsetWidth,
          opacity: 1,
        })
      }
    } else if (activeTab === "media") {
      setNavIndicatorStyle((prev) => ({ ...prev, opacity: 0 }))
    }
  }, [activeTab])

  // 초기 렌더링 및 탭 변경 시 인디케이터 위치 업데이트
  useEffect(() => {
    // 레이아웃이 확정될 때까지 여러 번 시도 (초기 로드 대응)
    const handleUpdate = () => {
      updateNavIndicator();
    };

    // 1. 즉시 실행
    handleUpdate();
    
    // 2. 마운트 직후 (레이아웃 확정 대응)
    const timer1 = setTimeout(handleUpdate, 50);
    const timer2 = setTimeout(handleUpdate, 300); // 폰트 로딩 등 지연 대응
    
    // 윈도우 리사이즈 시에도 위치 재계산
    window.addEventListener('resize', handleUpdate);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [updateNavIndicator, factbook]) // factbook 데이터 로드 시점 대응 추가

  // ✅ 페이지 이탈 방지 (항목 추가 중일 때)
  useEffect(() => {
    if (isAddingItem) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = '항목 추가 중입니다. 페이지를 나가시겠습니까?'
      }
      
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isAddingItem])

  // 팩트북 조회 함수 (재사용 가능하도록 별도 정의)
  const fetchFactbook = useCallback(async () => {
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
          status: data.status || "draft",
          analysisItems: data.analysis_items || { media: false },
          items: (data.items || []).map((item: any) => ({
            id: String(item.id),
            product_name: item.product_name || "",
            competitors: item.competitors || [],
            proposals: item.proposals || [],
            target_customers: item.target_customers || [],
          })),
          references: (data.references || []).map((ref: any) => ({
            id: String(ref.id),
            type: ref.type,
            name: ref.name || "",
            url: ref.url || "",
            content: ref.content || "",
            file_size: ref.file_size,
            content_type: ref.content_type,
          })),
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
                related_questions: subSection.related_questions || [],
              }
            })

            // section 레벨의 sources는 모든 subSection의 sources를 flatMap (계산용)
            const allSources: Source[] = subSectionsWithSources.flatMap(
              (subSection: SubSection) => subSection.sources || []
            )

            return {
              id: String(section.id),
              type: section.type || "", // section_type 추가
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
  }, [params.id, toast])

  // 항목 추가 후 새로 생성된 항목으로 스크롤
  const handleItemAdded = useCallback(async (newItemId?: number) => {
    await fetchFactbook()
    if (newItemId != null) {
      setTimeout(() => {
        const el = document.getElementById(`section-${newItemId}`)
        el?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 200)
    }
  }, [fetchFactbook])

  // 항목 삭제 함수
  const handleDeleteItem = useCallback(async (itemId: string, itemTitle: string) => {
    if (!confirm(`'${itemTitle}'을(를) 삭제하시겠습니까?\n삭제된 항목은 복구할 수 없습니다.`)) {
      return
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const res = await fetch(
        `${backendUrl}/api/factbooks/${params.id}/items/${itemId}`,
        { method: 'DELETE' }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || '항목 삭제에 실패했습니다')
      }

      // 성공
      toast({
        title: "✅ 항목 삭제 완료",
        description: `'${itemTitle}'이(가) 삭제되었습니다`,
      })

      // 팩트북 재조회
      await fetchFactbook()

    } catch (error: any) {
      console.error('항목 삭제 실패:', error)
      toast({
        title: "❌ 항목 삭제 실패",
        description: error.message || "항목 삭제에 실패했습니다",
        variant: "destructive"
      })
    }
  }, [params.id, toast, fetchFactbook])

  // 하위 항목 URL 복사 (해시 링크)
  const handleShareSubSection = useCallback(async (subSectionId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#section-${subSectionId}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "✅ 링크가 복사되었습니다",
        description: "이 항목의 링크를 공유할 수 있습니다.",
      })
    } catch (err) {
      toast({
        title: "❌ 복사 실패",
        description: "링크를 복사할 수 없습니다.",
        variant: "destructive",
      })
    }
  }, [toast])

  // 팩트북 조회 useEffect
  useEffect(() => {
    if (params.id) {
      fetchFactbook()
    }
  }, [params.id, fetchFactbook])

  // URL 해시(#section-xxx)로 진입 시 해당 하위 항목으로 스크롤
  useEffect(() => {
    if (!factbook) return
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    if (!hash || !hash.startsWith("#section-")) return
    const sectionId = hash.replace("#", "")
    const el = document.getElementById(sectionId)
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 300)
    }
  }, [factbook])

  useEffect(() => {
    const mainContent = mainContentRef.current
    if (!mainContent) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // 메인 콘텐츠 div의 스크롤이 최상단(0)이 아닐 때만 버튼 표시
          setShowScrollButton(mainContent.scrollTop > 0)
          ticking = false
        })
        ticking = true
      }
    }
    mainContent.addEventListener("scroll", handleScroll, { passive: true })

    // 초기 상태 확인
    handleScroll()
    
    return () => mainContent.removeEventListener("scroll", handleScroll)
  }, [factbook]) // factbook이 로드된 후에도 다시 설정

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
      title: "공유 링크가 복사되었습니다.",
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

  // 활성화된 섹션의 출처와 이미지 가져오기
  const getActiveSectionData = useCallback(() => {
    if (!factbook) {
      return { sources: [], images: [] }
    }
    
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
    
    const sources = activeSubSection.sources || []
    const images = sources.filter((s) => s.imageUrl).map((s) => s.imageUrl!)
    
    return { sources, images }
  }, [factbook, activeSection])

  const { sources: activeSources, images: activeImages } = getActiveSectionData()

  // 모든 섹션에서 모든 출처와 이미지를 통합해서 가져오기
  const getAllFactbookData = useCallback(() => {
    if (!factbook) return { allSources: [], allImages: [] }
    
    const allSourcesMap = new Map<string, Source>()
    const allImagesList: { imageUrl: string, sourceUrl?: string }[] = []
    const seenImageUrls = new Set<string>()
    
    factbook.sections.forEach(section => {
      section.subSections.forEach(subSection => {
        subSection.sources?.forEach(source => {
          if (source.url) {
            allSourcesMap.set(source.url, source)
          }
          if (source.imageUrl && !seenImageUrls.has(source.imageUrl)) {
            seenImageUrls.add(source.imageUrl)
            allImagesList.push({
              imageUrl: source.imageUrl,
              sourceUrl: source.url
            })
          }
        })
      })
    })
    
    return {
      allSources: Array.from(allSourcesMap.values()),
      allImages: allImagesList
    }
  }, [factbook])

  const { allSources, allImages } = getAllFactbookData()

  const handleTableCopy = useCallback(() => {
    toast({
      title: "표가 복사되었습니다.",
      duration: 2000,
    })
  }, [toast])

  const handleImageClick = useCallback((imageUrl: string) => {
    const currentImages = activeTab === "images" ? allImages.map(img => img.imageUrl) : activeImages
    const index = currentImages.indexOf(imageUrl)
    if (index !== -1) {
      setSelectedImageIndex(index)
    }
  }, [activeTab, allImages, activeImages])

  // 핸들러를 Ref에 저장하여 마크다운 컴포넌트들이 리렌더링되지 않도록 함
  const handlersRef = useRef({ handleTableCopy, handleImageClick })
  useEffect(() => {
    handlersRef.current = { handleTableCopy, handleImageClick }
  }, [handleTableCopy, handleImageClick])

  // 마크다운 컴포넌트 구성을 useMemo로 고정 (의존성 없음)
  const markdownComponents = useMemo(() => ({
    h1: ({ children, ...props }: any) => <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">{children}</h3>,
    h2: ({ children, ...props }: any) => <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">{children}</h3>,
    h3: ({ children, ...props }: any) => <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">{children}</h3>,
    h4: ({ children, ...props }: any) => <h4 {...props} className="text-base font-bold text-[#354355] mt-3 mb-1">{children}</h4>,
    p: ({ children, ...props }: any) => <div {...props} className="mb-2 leading-6 font-medium text-[#334155] text-sm">{children}</div>,
    ul: ({ children, ...props }: any) => <ul {...props} className="list-disc font-medium list-outside mb-4 space-y-1 ml-5">{children}</ul>,
    ol: ({ children, ...props }: any) => <ol {...props} className="list-decimal font-medium list-outside mb-4 space-y-1 ml-5">{children}</ol>,
    li: ({ children, ...props }: any) => <li {...props} className="leading-6 font-medium text-[#334155] text-sm">{children}</li>,
    strong: ({ children, ...props }: any) => <strong {...props} className="font-semibold text-slate-900">{children}</strong>,
    em: ({ children, ...props }: any) => <em {...props} className="italic">{children}</em>,
    code: ({ children, className, ...props }: any) => {
      const isInline = !className
      return isInline 
        ? <code {...props} className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
        : <code {...props} className={className}>{children}</code>
    },
    pre: ({ children, ...props }: any) => <pre {...props} className="bg-slate-100 border border-slate-300 rounded p-4 overflow-x-auto mb-4">{children}</pre>,
    blockquote: ({ children, ...props }: any) => <blockquote {...props} className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600">{children}</blockquote>,
    table: (props: any) => <MarkdownTable {...props} onTableCopy={() => handlersRef.current.handleTableCopy()} />,
    img: (props: any) => <MarkdownImg {...props} onImageClick={(src: string) => handlersRef.current.handleImageClick(src)} />,
    a: MarkdownLink,
    thead: ({ children, ...props }: any) => <thead {...props} className="bg-[#f8fafc]">{children}</thead>,
    tbody: ({ children, ...props }: any) => <tbody {...props} className="bg-white">{children}</tbody>,
    tr: ({ children, ...props }: any) => <tr {...props} className="border-b border-slate-100 last:border-0">{children}</tr>,
    th: ({ children, ...props }: any) => <th {...props} className="px-6 py-3 text-left text-xs font-bold text-[#4D5D71] border-r border-slate-100 last:border-0">{children}</th>,
    td: ({ children, ...props }: any) => <td {...props} className="px-6 py-3 text-sm text-[#334155] border-r border-slate-100 last:border-0 font-medium">{children}</td>,
    hr: () => <hr className="my-6 border-slate-300" />,
  }), []) // 의존성을 비워 컴포넌트 객체의 참조를 영구히 고정합니다.



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

  const handleExport = async () => {
    if (!factbook) return
    
    try {
      toast({
        title: "문서를 생성하는 중입니다...",
        duration: 2000,
      })
      
      await exportFactbookToWord(factbook)
      
      toast({
        title: "문서가 다운로드되었습니다.",
        duration: 2000,
      })
    } catch (error) {
      console.error("문서 내보내기 실패:", error)
      toast({
        title: "문서 내보내기에 실패했습니다.",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleScrollToTop = () => {
    // 메인 콘텐츠 div를 최상단으로 스크롤
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // 본문의 [숫자] 패턴을 출처 URL 링크로 변환 (마크다운 링크 형식)
  const convertCitationLinks = (content: string, sources: Source[] = []): string => {
    if (!sources || sources.length === 0) {
      return content
    }

    // 연속된 [숫자] 패턴을 찾아서 하나의 그룹으로 변환 (예: [1][2] -> [CITATION_GROUP_1_2](url))
    return content.replace(/(?:\[(\d+)\])+/g, (match) => {
      const indices = [...match.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1], 10))
      const validIndices = indices.filter(idx => idx > 0 && idx <= sources.length)
      
      if (validIndices.length === 0) return match
      
      // 첫 번째 유효한 출처의 URL을 대표 링크로 사용
      const firstUrl = sources[validIndices[0] - 1]?.url || "#"
      // 특수 마커를 사용하여 나중에 컴포넌트에서 통합 배지로 변환
      return `[CITATION_GROUP_${validIndices.join("_")}](${firstUrl})`
    })
  }

  // 특수문자가 포함된 볼드체를 올바르게 파싱하기 위한 전처리
  const preprocessMarkdown = (content: string): string => {
    // ReactMarkdown이 제대로 파싱하지 못하는 볼드체 패턴들을 <strong> 태그로 변환
    let processed = content
    
    // 특수문자 패턴: 괄호, %, 따옴표, 기타 등등
    const hasSpecialChars = (text: string) => /[()%"'`~!@#$^&+=\[\]{}|\\:;<>,?/]/.test(text)
    
    // 모든 **텍스트** 패턴을 찾아서 특수문자가 있으면 <strong>으로 변환
    // 더 포괄적인 패턴 사용
    processed = processed.replace(/\*\*([^*\n]+?)\*\*/g, (match, text) => {
      if (hasSpecialChars(text)) {
        return `<strong>${text}</strong>`
      }
      return match
    })
    
    return processed
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
          <SourcesContext.Provider key={`ctx-${subSection.id}-${match.index}`} value={sources}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {preprocessMarkdown(convertCitationLinks(textSegment, sources))}
            </ReactMarkdown>
          </SourcesContext.Provider>
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
            <ChartRenderer viz={viz} sources={sources} />
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
        <SourcesContext.Provider key={`ctx-${subSection.id}-last`} value={sources}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {preprocessMarkdown(convertCitationLinks(remaining, sources))}
          </ReactMarkdown>
        </SourcesContext.Provider>
      )
    }

    // 만약 본문에 {{CHART_ID}}를 넣지 않아도, 응답 JSON에 있는 차트를 모두 노출
    const unusedVisualizations = visualizations.filter((viz) => !usedChartIds.has(viz.id))
    if (unusedVisualizations.length > 0) {
      unusedVisualizations.forEach((viz) => {
        nodes.push(
          <div key={`chart-${subSection.id}-${viz.id}-fallback`} className="my-4">
            <ChartRenderer viz={viz} sources={sources} />
          </div>
        )
      })
    }

    return <div className="space-y-4">{nodes}</div>
  }

  const handleSubSectionClick = (subSectionId: string) => {
    // 탭이 팩트북이 아니면 팩트북으로 전환
    if (activeTab !== "factbook") {
      setActiveTab("factbook")
    }

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
    // 탭이 팩트북이 아니면 팩트북으로 전환
    if (activeTab !== "factbook") {
      setActiveTab("factbook")
    }

    const section = factbook?.sections.find((s) => s.id === sectionId)
    if (!section) return

    // 수동 스크롤 시작
    setIsManualScroll(true)
    setSelectedImageIndex(null)

    // 대분류 헤더 위치로 이동
    const element = document.getElementById(`section-main-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: "auto", block: "start" })
    }

    // 사이드바 하이라이트를 위해 첫 번째 중분류를 활성 섹션으로 설정
    if (section.subSections.length > 0) {
      setActiveSection(section.subSections[0].id)
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

  // 섹션 제목에 따른 아이콘 매핑
  const getSectionIcon = (title: string) => {
    if (title.includes("기업")) return <Building2 className="w-4 h-4" />
    if (title.includes("시장")) return <Globe className="w-4 h-4" />
    if (title.includes("자사")) return <Star className="w-4 h-4" />
    if (title.includes("경쟁")) return <Search className="w-4 h-4" />
    if (title.includes("타겟")) return <Target className="w-4 h-4" />
    if (title.includes("소재")) return <Tv className="w-4 h-4" />
    return <FileSearch className="w-4 h-4" />
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
    const currentImages = activeTab === "images" ? allImages.map(img => img.imageUrl) : activeImages
    if (selectedImageIndex !== null && selectedImageIndex < currentImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1)
    }
  }

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={2000}>
      <div className="min-h-screen bg-white" style={{ fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif' }}>
        {/* 헤더 */}
        <header className="sticky top-0 bg-white border-b border-slate-200 z-50">
          <div className="max-w-full px-6">
            <div className="flex items-center justify-between h-16">
              {/* 왼쪽: 뒤로가기, 회사명 */}
              <div className="flex items-center gap-4 flex-1">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>

                <h1 className="text-base text-[#475569] flex items-baseline gap-1.5">
                  <span className="font-bold">{factbook.companyName}</span>
                  <span className="text-[14px] font-medium text-slate-500">{factbook.productName}</span>
                </h1>
              </div>

              {/* 오른쪽: 메뉴 버튼들 */}
              <nav className="flex items-center gap-6 relative h-16">
                <button
                  ref={(el) => { navTabsRef.current[0] = el; }}
                  onClick={() => {
                    setActiveTab("factbook");
                    setSourceTab("source");
                    setSelectedImageIndex(null);
                  }}
                  className={`flex items-center gap-2 px-1 h-full text-sm font-medium transition-colors ${
                    activeTab === "factbook"
                      ? "text-[#295DFA]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileSearch className="w-5 h-5" />
                  <span>팩트북</span>
                </button>

                <button
                  ref={(el) => { navTabsRef.current[1] = el; }}
                  onClick={() => {
                    setActiveTab("files");
                    setSelectedImageIndex(null);
                  }}
                  className={`flex items-center gap-2 px-1 h-full text-sm font-medium transition-colors ${
                    activeTab === "files"
                      ? "text-[#295DFA]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Folder className="w-5 h-5" />
                  <span>파일</span>
                </button>

                <button
                  ref={(el) => { navTabsRef.current[2] = el; }}
                  onClick={() => {
                    setActiveTab("links");
                    setSelectedImageIndex(null);
                  }}
                  className={`flex items-center gap-2 px-1 h-full text-sm font-medium transition-colors ${
                    activeTab === "links"
                      ? "text-[#295DFA]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Link2 className="w-5 h-5" />
                  <span>링크</span>
                </button>

                <button
                  ref={(el) => { navTabsRef.current[3] = el; }}
                  onClick={() => {
                    setActiveTab("images");
                    setSelectedImageIndex(null);
                  }}
                  className={`flex items-center gap-2 px-1 h-full text-sm font-medium transition-colors ${
                    activeTab === "images"
                      ? "text-[#295DFA]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span>이미지</span>
                </button>

                {/* 슬라이딩 인디케이터 (메인 컬러) */}
                <div
                  className="absolute bottom-[-1px] h-[3px] bg-[#295DFA] rounded-t-full transition-all duration-300 ease-in-out"
                  style={{
                    left: navIndicatorStyle.left,
                    width: navIndicatorStyle.width,
                    opacity: navIndicatorStyle.opacity,
                  }}
                />
              </nav>
            </div>
          </div>
        </header>

      <div className="flex h-[calc(100vh-65px)] overflow-hidden">
        {/* 목차 사이드바 표시 (모든 탭에서 유지) */}
        {factbook && (
          <aside className="w-72 border-r border-slate-200 bg-[#f8fafc] flex flex-col flex-shrink-0 overflow-hidden">
            {/* 상단 목차 영역 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-[#64748b] text-s tracking-wider uppercase">목차</h3>
              </div>

              <Accordion 
                type="single" 
                collapsible 
                className="w-full space-y-2"
                value={expandedSection}
                onValueChange={setExpandedSection}
              >
                {factbook.sections.map((section, idx) => {
                  const isExpanded = expandedSection === section.id
                  const hasActiveSubSection = section.subSections.some((ss) => ss.id === activeSection)
                  
                  return (
                    <AccordionItem 
                      key={section.id} 
                      value={section.id}
                      className={`border-none rounded-xl transition-all duration-200 ${
                        isExpanded ? "bg-white shadow-sm ring-1 ring-slate-200" : ""
                      }`}
                    >
                      <AccordionPrimitive.Header className="flex">
                        <button
                          onClick={() => handleSectionClick(section.id)}
                          className={`flex flex-1 items-center gap-3 text-left py-3 px-4 transition-colors ${
                            isExpanded || hasActiveSubSection ? "text-[#1e293b]" : "text-[#64748b]"
                          }`}
                        >
                          <span className={`${isExpanded || hasActiveSubSection ? "text-[#3b82f6]" : "text-[#94a3b8]"}`}>
                            {getSectionIcon(section.title)}
                          </span>
                          <span className={`text-[14px] font-bold ${isExpanded ? "text-[#1e293b]" : ""}`}>
                            {section.title}
                          </span>
                        </button>
                        <AccordionPrimitive.Trigger
                          className="flex items-center justify-center pr-4 text-[#94a3b8] transition-transform duration-200 [&[data-state=open]>svg]:rotate-180"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        </AccordionPrimitive.Trigger>
                      </AccordionPrimitive.Header>
                      
                      <AccordionContent className="pb-3 px-2">
                        <div className="space-y-1">
                          {section.subSections.map((subSection, ssIdx) => {
                            const isActive = activeSection === subSection.id
                            return (
                              <button
                                key={subSection.id}
                                onClick={() => handleSubSectionClick(subSection.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all ${
                                  isActive
                                    ? "bg-[#f1f5f9] text-[#1e293b]"
                                    : "text-[#64748b] hover:bg-slate-50"
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isActive ? "bg-[#475569] text-white" : "bg-[#e2e8f0] text-[#94a3b8]"
                                }`}>
                                  {ssIdx + 1}
                                </div>
                                <span className={`text-[12px] leading-tight ${isActive ? "font-bold" : "font-medium"}`}>
                                  {subSection.title}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>

              {/* 매체 소재 분석 섹션 (항상 표시) */}
              <div className="mt-2 border-t border-slate-200 pt-2">
                <button
                  onClick={() => {
                    setActiveTab("media")
                    setExpandedSection(undefined) // 다른 섹션 닫기
                  }}
                  className={`w-full flex items-center gap-3 text-left py-3 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === "media"
                      ? "bg-white shadow-sm ring-1 ring-slate-200 text-[#1e293b]"
                      : "text-[#64748b] hover:bg-white/50"
                  }`}
                >
                  <span className={`${activeTab === "media" ? "text-[#3b82f6]" : "text-[#94a3b8]"}`}>
                    <Tv className="w-5 h-5" />
                  </span>
                  <span className={`text-[14px] font-bold ${activeTab === "media" ? "text-[#1e293b]" : ""}`}>
                    매체 소재 분석
                  </span>
                </button>
              </div>
            </div>

            {/* 하단 메타 정보 영역 */}
            <div className="px-9 py-5 bg-[#f8fafc]">
              <div className="w-full h-[1.5px] bg-[#354355] mb-1 opacity-70" />
              <div className="space-y-2 mb-4">
                <table className="w-full text-[11px]">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="py-1">
                      <td className="text-[#94a3b8] py-1 w-16 font-medium">기업</td>
                      <td className="text-[#475569] pl-4 py-1 font-semibold text-left">{factbook.companyName}</td>
                    </tr>
                    <tr className="py-1">
                      <td className="text-[#94a3b8] py-1 w-16 font-medium">업종</td>
                      <td className="text-[#475569] pl-4 py-1 font-semibold text-left">{factbook.category || "기타"}</td>
                    </tr>
                    <tr className="py-1">
                      <td className="text-[#94a3b8] py-1 w-16 font-medium">제품/서비스</td>
                      <td className="text-[#475569] pl-4 py-1 font-semibold text-left">{factbook.productName}</td>
                    </tr>
                    <tr className="py-1 border-t border-dashed border-slate-300">
                      <td className="text-[#94a3b8] py-1 w-16 font-medium">생성일</td>
                      <td className="text-[#475569] pl-4 py-1 font-semibold text-left">
                        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </td>
                    </tr>
                    <tr 
                      className="py-1 cursor-pointer hover:bg-slate-50 transition-colors group/row"
                      onClick={() => setIsInputInfoOpen(true)}
                    >
                      <td className="text-[#94a3b8] py-1 w-16 font-medium">입력 정보</td>
                      <td className="text-[#475569] pl-4 py-1 font-semibold text-left flex justify-start items-center">
                        <div className="w-4 h-4 rounded bg-[#e2e8f0] flex items-center justify-center text-[#94a3b8] group-hover/row:bg-blue-100 group-hover/row:text-blue-600 transition-colors">
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShare}
                  className="h-8 text-[11px] font-bold text-[#64748b] bg-white border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
                >
                  공유하기
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport}
                  className="h-8 text-[11px] font-bold text-[#64748b] bg-white border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
                >
                  내보내기
                </Button>
              </div>
            </div>
          </aside>
        )}

        {/* 메인 콘텐츠 */}
        <div ref={mainContentRef} className="flex-1 overflow-y-auto relative bg-white">
          <div className="p-8 relative">
            {activeTab === "factbook" ? (
              <div className="max-w-5xl mx-auto px-12 space-y-12">
                {factbook.sections.map((section, sIdx) => (
                  <div key={section.id} className="space-y-6">
                    {/* Depth 1: 목차 (H1) */}
                    <div 
                      id={`section-main-${section.id}`}
                      className="bg-[#f8fafc] rounded-xl py-3 px-6 flex items-center gap-4 border border-[#e2e8f0] scroll-mt-8"
                    >
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-[#e2e8f0] shadow-sm">
                        <Search className="w-3.5 h-3.5 text-[#3b82f6]" />
                      </div>
                      <h1 className="text-[22px] font-bold text-[#4D5D71]">{section.title}</h1>
                    </div>

                    {section.subSections.map((subSection, ssIdx) => (
                      <section
                        key={subSection.id}
                        id={`section-${subSection.id}`}
                        className="scroll-mt-8 group"
                      >
                        {/* Depth 2: 중분류 (H2) */}
                        <div className="flex items-center gap-3 mb-3 ml-3">
                          <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                            {ssIdx + 1}
                          </div>
                          <h2 className="text-[18px] font-extrabold text-[#354355] flex-1">{subSection.title}</h2>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="더보기"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[120px]">
                              <DropdownMenuItem onClick={() => handleShareSubSection(subSection.id)}>
                                <Link2 className="w-4 h-4 mr-2" />
                                공유
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteItem(subSection.id, subSection.title)}
                                variant="destructive"
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Depth 3 & 4 (H3 & Contents) via Markdown */}
                        <div className="space-y-1 pl-11">
                          <div className="text-[#334155] text-sm leading-relaxed markdown-content">
                            {renderContentWithCharts(subSection)}
                          </div>

                          {/* 추천 항목 바 - 각 SubSection 하단 */}
                          {factbook.status === "completed" && subSection.related_questions && subSection.related_questions.length > 0 && (
                            <RecommendationBar
                              factbookId={Number(params.id)}
                              sectionType={section.type}
                              sectionTitle={section.title}
                              relatedQuestions={subSection.related_questions}
                              existingTitles={section.subSections.map(s => s.title)}
                              onItemAdded={handleItemAdded}
                              isAddingItem={isAddingItem}
                              setIsAddingItem={setIsAddingItem}
                              addingSection={addingSection}
                              setAddingSection={setAddingSection}
                            />
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                ))}
              </div>
            ) : (activeTab as string) === "files" ? (
              <div className="max-w-6xl mx-auto px-12">
                <h2 className="text-2xl font-bold text-[#4D5D71] mb-10">참고 파일</h2>
                
                {factbook.references && factbook.references.filter(ref => ref.type === 'file' || ref.type === 'text').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {factbook.references
                      .filter(ref => ref.type === 'file' || ref.type === 'text')
                      .map((ref) => {
                      const getFileInfo = (name: string, type: string) => {
                        if (type === "text") {
                          return { icon: FileText, bg: "bg-emerald-50", text: "text-emerald-500", label: "텍스트" }
                        }
                        const ext = name?.split('.').pop()?.toLowerCase()
                        switch(ext) {
                          case 'pdf': return { icon: FileText, bg: "bg-red-50", text: "text-red-500", label: "PDF" }
                          case 'ppt':
                          case 'pptx': return { icon: FileText, bg: "bg-orange-50", text: "text-orange-500", label: "PPT" }
                          case 'doc':
                          case 'docx': return { icon: FileText, bg: "bg-blue-50", text: "text-blue-500", label: "Word" }
                          case 'xls':
                          case 'xlsx': return { icon: FileText, bg: "bg-green-50", text: "text-green-600", label: "Excel" }
                          case 'txt': return { icon: FileText, bg: "bg-slate-100", text: "text-slate-500", label: "기타" }
                          default: return { icon: Folder, bg: "bg-slate-100", text: "text-slate-500", label: "파일" }
                        }
                      }
                      const fileInfo = getFileInfo(ref.name, ref.type)
                      const IconComponent = fileInfo.icon
                      const handleDownload = async (e: React.MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
                          const response = await fetch(`${backendUrl}/api/references/${ref.id}/download`)
                          if (!response.ok) throw new Error('다운로드 실패')
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          let downloadName = ref.name
                          if (ref.type === "text" && !downloadName.toLowerCase().endsWith(".txt")) downloadName += ".txt"
                          a.download = downloadName
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        } catch (error) {
                          console.error('참고 자료 다운로드 실패:', error)
                          alert('참고 자료 다운로드에 실패했습니다.')
                        }
                      }
                      return (
                        <div key={ref.id} className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fileInfo.bg} ${fileInfo.text}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-slate-800 truncate" title={ref.name}>{ref.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 text-slate-400 font-medium">
                                {fileInfo.label}
                              </Badge>
                              {ref.file_size && <span className="text-[10px] text-slate-400">{(ref.file_size / 1024).toFixed(1)} KB</span>}
                            </div>
                          </div>
                          <button onClick={handleDownload} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 transition-all" title="다운로드">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
                    <p className="text-slate-500 text-sm">등록된 참고 파일이 없습니다.</p>
                  </div>
                )}
              </div>
            ) : (activeTab as string) === "images" ? (
              <div className="max-w-6xl mx-auto px-12">
                <h2 className="text-2xl font-bold text-[#4D5D71] mb-6">이미지</h2>
                
                {allImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allImages.map((imgData, idx) => {
                      const getDomainFromUrl = (url?: string) => {
                        if (!url) return null
                        try {
                          const urlObj = new URL(url)
                          return urlObj.hostname.replace('www.', '')
                        } catch { return null }
                      }
                      const domain = getDomainFromUrl(imgData.sourceUrl)
                      const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null

                      return (
                        <div key={idx} className="flex flex-col gap-2">
                          <div 
                            className="aspect-video bg-slate-100 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative group"
                            onClick={() => handleImageClick(imgData.imageUrl)}
                          >
                            <img src={imgData.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                          {(domain || imgData.sourceUrl) && (
                            <div className="flex items-center gap-1.5 px-1 min-h-0">
                              {faviconUrl && (
                                <img src={faviconUrl} alt="" className="w-3.5 h-3.5 flex-shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
                              )}
                              {imgData.sourceUrl ? (
                                <a
                                  href={imgData.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] text-slate-500 truncate hover:text-blue-600 hover:underline"
                                  title={imgData.sourceUrl}
                                >
                                  {domain || imgData.sourceUrl}
                                </a>
                              ) : (
                                domain && <span className="text-[11px] text-slate-500 truncate">{domain}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
                    <p className="text-slate-500 text-sm">수집된 이미지가 없습니다.</p>
                  </div>
                )}
              </div>
            ) : activeTab === "links" ? (
              <div className="max-w-6xl mx-auto px-12">
                <h2 className="text-2xl font-bold text-[#4D5D71] mb-10">링크</h2>
                
                {/* 1. 참고 링크 Section (데이터가 있을 때만 노출) */}
                {factbook.referenceLinks && factbook.referenceLinks.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6 ml-1">
                      <h3 className="text-[20px] font-extrabold text-[#354355]">참고 링크</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {factbook.referenceLinks.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <Link2 className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[15px] font-bold text-slate-800 truncate">{link.title || "참고 링크"}</h4>
                            <span className="text-[11px] text-slate-400 truncate">{link.url}</span>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-300" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1.5. 참고 자료 Section (사용자가 업로드한 링크만 노출) */}
                {factbook.references && factbook.references.filter(ref => ref.type === 'link').length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-2 mb-6 ml-1">
                      <h3 className="text-[20px] font-extrabold text-[#354355]">참고 링크</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {factbook.references
                        .filter(ref => ref.type === 'link')
                        .map((ref) => {
                        return (
                          <a 
                            key={ref.id}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-50 text-amber-500">
                              <Link2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-bold text-slate-800 truncate" title={ref.name}>{ref.name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 text-slate-400 font-medium">
                                  링크
                                </Badge>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300" />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 2. 수집 링크 Section */}
                <div>
                  <div className="flex items-center gap-3 mb-8 ml-1">
                    <h3 className="text-[20px] font-extrabold text-[#354355]">수집 링크</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allSources.length > 0 ? (
                      allSources.map((source, idx) => {
                        const getDomainFromUrl = (url: string) => {
                          try {
                            const urlObj = new URL(url)
                            return urlObj.hostname.replace('www.', '')
                          } catch { return null }
                        }
                        const domain = source.url ? getDomainFromUrl(source.url) : null
                        const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null

                        return (
                          <a 
                            key={idx}
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:shadow-sm"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 group-hover:bg-white">
                              {faviconUrl ? (
                                <img src={faviconUrl} alt="" className="w-5 h-5" onError={(e) => e.currentTarget.style.display = 'none'} />
                              ) : (
                                <Globe className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-[15px] font-bold text-slate-800 group-hover:text-[#1a0dab] truncate mb-0.5">
                                {source.title || "제목 없음"}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-400 truncate">{domain}</span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                          </a>
                        )
                      })
                    ) : (
                      <div className="col-span-full bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
                        <p className="text-slate-500 text-sm">수집된 참고 자료가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (activeTab as string) === "files" ? (
              <div className="max-w-6xl mx-auto px-12">
                <h2 className="text-2xl font-bold text-[#4D5D71] mb-10">참고 파일</h2>
                
                {factbook.references && factbook.references.filter(ref => ref.type === 'file' || ref.type === 'text').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {factbook.references
                      .filter(ref => ref.type === 'file' || ref.type === 'text')
                      .map((ref) => {
                      const getFileInfo = (name: string, type: string) => {
                        if (type === "text") {
                          return { icon: FileText, bg: "bg-emerald-50", text: "text-emerald-500", label: "텍스트" }
                        }
                        const ext = name?.split('.').pop()?.toLowerCase()
                        switch(ext) {
                          case 'pdf': return { icon: FileText, bg: "bg-red-50", text: "text-red-500", label: "PDF" }
                          case 'ppt':
                          case 'pptx': return { icon: FileText, bg: "bg-orange-50", text: "text-orange-500", label: "PPT" }
                          case 'doc':
                          case 'docx': return { icon: FileText, bg: "bg-blue-50", text: "text-blue-500", label: "Word" }
                          case 'xls':
                          case 'xlsx': return { icon: FileText, bg: "bg-green-50", text: "text-green-600", label: "Excel" }
                          case 'txt': return { icon: FileText, bg: "bg-slate-100", text: "text-slate-500", label: "기타" }
                          default: return { icon: Folder, bg: "bg-slate-100", text: "text-slate-500", label: "파일" }
                        }
                      }
                      const fileInfo = getFileInfo(ref.name, ref.type)
                      const IconComponent = fileInfo.icon
                      const handleDownload = async (e: React.MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        try {
                          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
                          const response = await fetch(`${backendUrl}/api/references/${ref.id}/download`)
                          if (!response.ok) throw new Error('다운로드 실패')
                          const blob = await response.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          let downloadName = ref.name
                          if (ref.type === "text" && !downloadName.toLowerCase().endsWith(".txt")) downloadName += ".txt"
                          a.download = downloadName
                          document.body.appendChild(a)
                          a.click()
                          window.URL.revokeObjectURL(url)
                          document.body.removeChild(a)
                        } catch (error) {
                          console.error('참고 자료 다운로드 실패:', error)
                          alert('참고 자료 다운로드에 실패했습니다.')
                        }
                      }
                      return (
                        <div key={ref.id} className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${fileInfo.bg} ${fileInfo.text}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-bold text-slate-800 truncate" title={ref.name}>{ref.name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 text-slate-400 font-medium">
                                {fileInfo.label}
                              </Badge>
                              {ref.file_size && <span className="text-[10px] text-slate-400">{(ref.file_size / 1024).toFixed(1)} KB</span>}
                            </div>
                          </div>
                          <button onClick={handleDownload} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-blue-600 transition-all" title="다운로드">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
                    <p className="text-slate-500 text-sm">등록된 참고 파일이 없습니다.</p>
                  </div>
                )}
              </div>
            ) : (activeTab as string) === "images" ? (
              <div className="max-w-6xl mx-auto px-12">
                <h2 className="text-2xl font-bold text-[#4D5D71] mb-4">이미지</h2>
                
                {allImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allImages.map((imgData, idx) => {
                      const getDomainFromUrl = (url?: string) => {
                        if (!url) return null
                        try {
                          const urlObj = new URL(url)
                          return urlObj.hostname.replace('www.', '')
                        } catch { return null }
                      }
                      const domain = getDomainFromUrl(imgData.sourceUrl)
                      const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null

                      return (
                        <div key={idx} className="flex flex-col gap-2">
                          <div 
                            className="aspect-video bg-slate-100 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative group"
                            onClick={() => handleImageClick(imgData.imageUrl)}
                          >
                            <img src={imgData.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                          {(domain || imgData.sourceUrl) && (
                            <div className="flex items-center gap-1.5 px-1 min-h-0">
                              {faviconUrl && (
                                <img src={faviconUrl} alt="" className="w-3.5 h-3.5 flex-shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
                              )}
                              {imgData.sourceUrl ? (
                                <a
                                  href={imgData.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] text-slate-500 truncate hover:text-blue-600 hover:underline"
                                  title={imgData.sourceUrl}
                                >
                                  {domain || imgData.sourceUrl}
                                </a>
                              ) : (
                                domain && <span className="text-[11px] text-slate-500 truncate">{domain}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
                    <p className="text-slate-500 text-sm">수집된 이미지가 없습니다.</p>
                  </div>
                )}
              </div>
            ) : (
              <MediaTab factbookId={params.id as string} />
            )}
          </div>

          {/* 맨 위로 스크롤 버튼 - 팩트북 본문 영역 우하단 고정 */}
          {showScrollButton && (
            <div className="sticky bottom-8 float-right mr-8" style={{ marginTop: '-4rem' }}>
              <button
                onClick={handleScrollToTop}
                className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-all duration-300 opacity-90 hover:opacity-100 z-40"
                aria-label="맨 위로 가기"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* 팩트북 탭일 때만 출처정보 패널 표시 (현재 디자인 수정을 위해 주석 처리) */}
        {false && activeTab === "factbook" && (
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
                        const source = activeSources.find((s) => s.imageUrl === imageUrl)
                        const sourceUrl = source?.url
                        const getDomainFromUrl = (url?: string) => {
                          if (!url) return null
                          try {
                            const urlObj = new URL(url)
                            return urlObj.hostname.replace("www.", "")
                          } catch { return null }
                        }
                        const domain = getDomainFromUrl(sourceUrl)
                        const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null
                        return (
                          <div key={idx} className="flex flex-col gap-1">
                            <div
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
                            {(domain || sourceUrl) && (
                              <div className="flex items-center gap-1 px-0.5 min-h-0">
                                {faviconUrl && (
                                  <img src={faviconUrl} alt="" className="w-3 h-3 flex-shrink-0" onError={(e) => e.currentTarget.style.display = "none"} />
                                )}
                                {sourceUrl ? (
                                  <a
                                    href={sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-slate-500 truncate hover:text-blue-600 hover:underline"
                                    title={sourceUrl}
                                  >
                                    {domain || sourceUrl}
                                  </a>
                                ) : (
                                  domain && <span className="text-[10px] text-slate-500 truncate">{domain}</span>
                                )}
                              </div>
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

            </div>
          </aside>
        )}
      </div>

      {/* 이미지 전체 화면 보기 팝업 */}
      {selectedImageIndex !== null && (activeTab === "images" ? allImages.length > 0 : activeImages.length > 0) && (
        <ImageViewer
          images={activeTab === "images" ? allImages.map(img => img.imageUrl) : activeImages}
          currentIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
          sourceUrls={activeTab === "images" ? allImages.map(img => img.sourceUrl) : activeImages.map(imgUrl => activeSources.find(s => s.imageUrl === imgUrl)?.url)}
        />
      )}

      {/* 입력 정보 상세 모달 */}
      <Dialog open={isInputInfoOpen} onOpenChange={setIsInputInfoOpen}>
        <DialogContent className="w-[80vw] !max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-none rounded-3xl shadow-2xl">
          <DialogHeader className="px-10 py-7 bg-[#f8fafc] border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">상세 입력 정보</DialogTitle>
                <p className="text-[14px] text-slate-500 font-medium">팩트북 생성을 위해 사용자가 입력한 정보입니다.</p>
              </div>
              {/* <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsInputInfoOpen(false)}
                className="rounded-full hover:bg-slate-200/50"
              >
                <ArrowUp className="w-5 h-5 rotate-180" />
              </Button> */}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div className="p-8 space-y-10">
              {/* 기본 정보 */}
              <section className="space-y-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-1 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-[17px] font-bold text-slate-900">기본 정보</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/80 rounded-xl p-6 border border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">기업명</label>
                    <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200/60 text-[14px] font-bold text-slate-900 shadow-sm">
                      {factbook.companyName}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">업종 카테고리</label>
                    <div className="bg-white px-4 py-2.5 rounded-lg border border-slate-200/60 text-[14px] font-bold text-slate-900 shadow-sm">
                      {factbook.category || "기타"}
                    </div>
                  </div>
                </div>
              </section>

              {/* 제품/서비스 정보 */}
              <section className="space-y-6">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-1 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-[17px] font-bold text-slate-900">제품/서비스 및 제안 요청</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  {factbook.items && factbook.items.length > 0 ? (
                    factbook.items.map((item, idx) => (
                      <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50/60 px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">Item #{idx + 1}</span>
                        </div>
                        <div className="p-6 space-y-6">
                          <div className="space-y-2">
                            <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wide ml-0.5">제품/서비스명</label>
                            <p className="text-[14px] font-bold text-slate-900 bg-blue-50/30 px-3 py-1.5 rounded-lg border border-blue-100/50 inline-block">{item.product_name || "-"}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <div className="w-3 h-3 border-l-2 border-b-2 border-slate-200 rounded-bl-[4px]" />
                                <label className="text-[13px] font-bold">경쟁사</label>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.competitors && item.competitors.length > 0 ? (
                                  item.competitors.map((c, i) => (
                                    <Badge key={i} variant="secondary" className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold rounded-lg">
                                      {c}
                                    </Badge>
                                  ))
                                ) : <span className="text-slate-300 text-xs italic">정보 없음</span>}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <div className="w-3 h-3 border-l-2 border-b-2 border-slate-200 rounded-bl-[4px]" />
                                <label className="text-[13px] font-bold">요구사항(제안)</label>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.proposals && item.proposals.length > 0 ? (
                                  item.proposals.map((p, i) => (
                                    <Badge key={i} variant="secondary" className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold rounded-lg">
                                      {p}
                                    </Badge>
                                  ))
                                ) : <span className="text-slate-300 text-xs italic">정보 없음</span>}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-slate-500">
                                <div className="w-3 h-3 border-l-2 border-b-2 border-slate-200 rounded-bl-[4px]" />
                                <label className="text-[13px] font-bold">타겟 고객</label>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.target_customers && item.target_customers.length > 0 ? (
                                  item.target_customers.map((t, i) => (
                                    <Badge key={i} variant="secondary" className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 text-[11px] font-semibold rounded-lg">
                                      {t}
                                    </Badge>
                                  ))
                                ) : <span className="text-slate-300 text-xs italic">정보 없음</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-400 text-sm italic">등록된 제품 정보가 없습니다.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* 참고 자료 */}
              <section className="space-y-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-1 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-[17px] font-bold text-slate-900">참고 자료</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {factbook.references && factbook.references.length > 0 ? (
                    factbook.references.map((ref) => {
                      // 확장자별 아이콘 및 라벨 설정
                      const getFileInfo = (name: string, type: string) => {
                        if (type === "link") {
                          return { icon: Link2, bg: "bg-white", text: "text-slate-600", label: "링크" }
                        }
                        if (type === "text") {
                          return { icon: FileText, bg: "bg-white", text: "text-slate-600", label: "텍스트" }
                        }
                        
                        const ext = name?.split('.').pop()?.toLowerCase()
                        switch(ext) {
                          case 'pdf':
                            return { icon: FileText, bg: "bg-white", text: "text-red-500", label: "PDF" }
                          case 'ppt':
                          case 'pptx':
                            return { icon: FilePieChart, bg: "bg-white", text: "text-orange-500", label: "PPT" }
                          case 'doc':
                          case 'docx':
                            return { icon: FileText, bg: "bg-white", text: "text-blue-500", label: "Word" }
                          case 'xls':
                          case 'xlsx':
                            return { icon: FileSpreadsheet, bg: "bg-white", text: "text-emerald-500", label: "Excel" }
                          case 'txt':
                            return { icon: FileText, bg: "bg-white", text: "text-slate-500", label: "기타" }
                          default:
                            return { icon: Folder, bg: "bg-white", text: "text-slate-500", label: "파일" }
                        }
                      }
                      
                      const fileInfo = getFileInfo(ref.name, ref.type)
                      const IconComponent = fileInfo.icon

                      // 다운로드 핸들러
                      const handleDownload = async (e: React.MouseEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                        
                        if (ref.type === "file" || ref.type === "text") {
                          try {
                            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
                            const response = await fetch(`${backendUrl}/api/references/${ref.id}/download`)
                            if (!response.ok) throw new Error('다운로드 실패')
                            
                            const blob = await response.blob()
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            
                            // 텍스트 타입인 경우 파일명에 .txt 확장자 보장
                            let downloadName = ref.name
                            if (ref.type === "text" && !downloadName.toLowerCase().endsWith(".txt")) {
                              downloadName += ".txt"
                            }
                            
                            a.download = downloadName
                            document.body.appendChild(a)
                            a.click()
                            window.URL.revokeObjectURL(url)
                            document.body.removeChild(a)
                          } catch (error) {
                            console.error('참고 자료 다운로드 실패:', error)
                            alert('참고 자료 다운로드에 실패했습니다.')
                          }
                        } else if (ref.url) {
                          window.open(ref.url, '_blank')
                        }
                      }
                      
                      return (
                        <div key={ref.id} className="group relative flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-all">
                          <div className={`w-10 h-10 rounded border border-slate-200 flex items-center justify-center shrink-0 ${fileInfo.bg} ${fileInfo.text}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-medium text-slate-900 truncate" title={ref.name}>{ref.name}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-medium text-slate-500 truncate italic uppercase">{fileInfo.label}</p>
                              {ref.file_size && (
                                <span className="text-[10px] text-slate-400">{(ref.file_size / 1024).toFixed(1)} KB</span>
                              )}
                            </div>
                          </div>
                          {(ref.type === "file" || ref.type === "text" || ref.url) && (
                            <button
                              onClick={handleDownload}
                              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-full flex-shrink-0 flex items-center justify-center"
                              title={ref.type === "file" || ref.type === "text" ? "다운로드" : "열기"}
                            >
                              {ref.type === "file" || ref.type === "text" ? (
                                <Download className="w-4 h-4" />
                              ) : (
                                <ExternalLink className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-400 text-sm italic">등록된 참고 자료가 없습니다.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="px-10 py-6 bg-[#f8fafc] border-t border-slate-100 flex justify-end shrink-0">
            <Button onClick={() => setIsInputInfoOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl px-8 h-12 shadow-lg shadow-slate-200 transition-all active:scale-95">
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  )
}
