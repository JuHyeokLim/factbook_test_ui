// "use client"

// import { useState, useEffect, useRef, ReactNode } from "react"
// import { useParams, useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { ArrowLeft, ArrowUp, Copy, Check, Download, FileSearch, Folder, Link2, Image as ImageIcon, Search, Building2, Globe, Star, Target, Tv, ExternalLink } from "lucide-react"
// import Link from "next/link"
// import { useToast } from "@/hooks/use-toast"
// import { MediaTab } from "@/components/factbook/media-tab"
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
// import * as AccordionPrimitive from "@radix-ui/react-accordion"
// import { ChevronDown } from "lucide-react"
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// import { ImageViewer } from "@/components/factbook/image-viewer"
// import ReactMarkdown, { Components } from "react-markdown"
// import remarkGfm from "remark-gfm"
// import rehypeRaw from "rehype-raw"
// import { AreaChart, BarChart, Card, DonutChart, LineChart, Text, Title, Legend } from "@tremor/react"
// import { exportFactbookToWord } from "@/lib/exportUtils"

// interface Source {
//   title: string
//   content: string
//   media: string
//   url?: string
//   imageUrl?: string
// }

// interface VisualizationItem {
//   id: string
//   component: "BarChart" | "LineChart" | "DonutChart" | "AreaChart"
//   title?: string
//   data?: Record<string, any>[]
//   index?: string
//   categories?: string[]
//   category?: string; // 추가: 백엔드가 단일 카테고리(라벨) 키를 줄 경우 대비
//   value?: string;    // 추가: 백엔드가 단일 값 키를 줄 경우 대비
//   colors?: string[]; // 추가: Tremor 차트 색상 배열
// }

// interface SubSection {
//   id: string
//   title: string
//   content: string
//   visualizations?: VisualizationItem[]
//   sources?: Source[] // subSection 레벨에 sources 추가
// }

// interface Section {
//   id: string
//   title: string
//   subSections: SubSection[]
//   sources?: Source[] // 선택적으로 유지 (계산용)
// }

// interface FactbookDetail {
//   id: string
//   companyName: string
//   productName: string
//   category: string
//   sections: Section[]
// }

// // <viz>...</viz> 또는 구(旧) [[VISUALIZATION_DATA]] 블록을 파싱
// const visualizationBlockRegex = /<viz>([\s\S]*?)<\/viz>|\[\[VISUALIZATION_DATA\]\]\s*([\s\S]*?)(?:<\/answer>|$)/i
// // <think>, <reasoning> 등 다양한 변형 태그 제거
// const redactedReasoningRegex = /<(?:redacted_)?(?:reasoning|think)>[\s\S]*?<\/(?:redacted_)?(?:reasoning|think)>/gi
// // <answer> ... </answer> 블록만 출력 대상으로 사용
// const answerBlockRegex = /<answer>([\s\S]*?)<\/answer>/gi

// // [수정] parseVisualizations 함수 전체 교체
// const parseVisualizations = (
//   rawContent: string
// ): { cleanedContent: string; visualizations: VisualizationItem[] } => {
//   // 1) 먼저 원본 content에서 viz 블록 추출 (answer 태그 안팎 모두 처리 가능)
//   const vizMatch = rawContent.match(visualizationBlockRegex)
//   let visualizations: VisualizationItem[] = []

//   if (vizMatch && (vizMatch[1] || vizMatch[2])) {
//     // [중요] 마크다운 코드 블록(```json 등) 제거 로직 추가
//     const captured = vizMatch[1] || vizMatch[2] || ""
//     let jsonText = captured.trim()
//     jsonText = jsonText
//       .replace(/^```json\s*/i, "")
//       .replace(/^```\s*/i, "")
//       .replace(/\s*```$/, "")

//     console.log("parseVisualizations: 추출된 JSON 텍스트:", jsonText)
//     try {
//       const parsed = JSON.parse(jsonText)
//       // 배열인지 혹은 객체 내부의 visualizations 배열인지 확인
//       const extracted = Array.isArray(parsed)
//         ? parsed
//         : Array.isArray((parsed as any)?.visualizations)
//         ? (parsed as any).visualizations
//         : []

//       if (Array.isArray(extracted)) {
//         visualizations = extracted
//           .filter((item) => item && typeof item.id === "string")
//           .map((item) => ({
//             ...item,
//             component: item.component,
//           }))
//         console.log("parseVisualizations: 파싱된 시각화 데이터:", visualizations)
//       }
//     } catch (error) {
//       console.warn("시각화 JSON 파싱 실패:", error)
//     }
//   }

//   // 2) reasoning/think 제거
//   let cleanedContent = rawContent.replace(redactedReasoningRegex, "")

//   // 3) answer 블록만 추출
//   const answerMatches = [...cleanedContent.matchAll(answerBlockRegex)]
//   if (answerMatches.length > 0) {
//     cleanedContent = answerMatches.map((m) => m[1]).join("\n\n")
//   }
//   cleanedContent = cleanedContent.trim()

//   // 4) viz 블록 제거
//   cleanedContent = cleanedContent.replace(visualizationBlockRegex, "").trim()
  
//   // 5) 남아있는 커스텀 태그들 제거 (안전장치)
//   cleanedContent = cleanedContent.replace(/<\/?answer>/gi, "")
//   cleanedContent = cleanedContent.replace(/<\/?think>/gi, "")
//   cleanedContent = cleanedContent.replace(/<\/?reasoning>/gi, "")
//   cleanedContent = cleanedContent.trim()
  
//   return { cleanedContent, visualizations }
// }

// const numberFormatter = (value: any) => {
//   if (value === null || value === undefined) return ""
//   if (typeof value === "number") return value.toLocaleString("ko-KR")
//   return String(value)
// }

// const sanitizeVisualizationData = (
//   viz: VisualizationItem, 
//   indexKey: string, 
//   categoryKeys: string[]
// ): { data: Record<string, any>[]; error?: string; invalidRows?: any[] } => {
//   // data가 없으면 빈 배열로 초기화
//   const { data = [] } = viz

//   if (!data || !data.length) return { error: "데이터가 없습니다.", data: [] }
//   if (!indexKey) return { error: "index(라벨) 키를 찾을 수 없습니다.", data: [] }
//   if (!categoryKeys || !categoryKeys.length) return { error: "categories(수치) 키를 찾을 수 없습니다.", data: [] }

//   const sanitizeNumber = (val: any) => {
//     if (typeof val === "number") return val
//     if (typeof val === "string") {
//       const cleaned = val.replace(/,/g, "").replace(/%/g, "").replace(/[^\d.\-+eE]/g, "")
//       if (cleaned.trim() === "") return NaN
//       const num = Number(cleaned)
//       return Number.isNaN(num) ? NaN : num
//     }
//     return NaN
//   }

//   const invalidRows: { row: any; reason: string }[] = []

//   const sanitized = data
//     .map((row) => {
//       // indexKey(라벨) 확인
//       if (!(indexKey in row)) {
//         invalidRows.push({ row, reason: `index 키 '${indexKey}' 누락` })
//         return null
//       }
      
//       const next = { ...row }
//       let valid = true
      
//       // categoryKeys(수치) 확인 및 변환
//       categoryKeys.forEach((cat) => {
//         if (!(cat in next)) {
//           valid = false
//           invalidRows.push({ row, reason: `category 키 '${cat}' 누락` })
//           return
//         }
//         const num = sanitizeNumber(next[cat])
//         if (Number.isNaN(num)) {
//           valid = false
//           invalidRows.push({ row, reason: `category '${cat}' 숫자 아님` })
//         } else {
//           next[cat] = num
//         }
//       })
//       return valid ? next : null
//     })
//     .filter(Boolean) as Record<string, any>[]

//   if (!sanitized.length) {
//     return { error: "유효한 데이터 행이 없습니다.", data: [], invalidRows }
//   }

//   return { data: sanitized, invalidRows }
// }

// // [수정] renderChartComponent 함수: 키 매핑 로직 + 출처 표시 추가
// const renderChartComponent = (viz: VisualizationItem, sources?: Source[]) => {
//   if (!viz) return null

//   const { id, component, title, data = [], index, categories = [], category, value, colors } = viz
//   const chartTitle = title || id

//   // 1. 라벨(X축/항목명) 키 결정
//   const chartIndex = index || category || "category"

//   // 2. 수치(Y축/값) 키 결정
//   const chartCategories = (categories && categories.length > 0) 
//     ? categories 
//     : [value || "value"]

//   // 3. 데이터 정제
//   const { data: sanitizedData, error: validationError } = sanitizeVisualizationData(
//     viz, 
//     chartIndex, 
//     chartCategories
//   )

//   // 4. 커스텀 툴팁 생성 (출처 정보 포함)
//   const customTooltip = ({ payload, active }: any) => {
//     if (!active || !payload || payload.length === 0) return null
    
//     const data = payload[0].payload
    
//     // DonutChart의 경우 처리
//     if (component === "DonutChart") {
//       const categoryValue = data[chartIndex] // 기업명 등
//       const measureKey = chartCategories[0] // value 키
//       const measureValue = data[measureKey] // 실제 값
//       const sourceField = `${measureKey}_출처`
//       const sourceText = data[sourceField] || ""
      
//       // 출처 번호에서 실제 출처 정보 추출
//       const sourceNumbers = sourceText.match(/\[(\d+)\]/g)
//       const sourceLinks = sourceNumbers?.map((match: string) => {
//         const num = parseInt(match.replace(/[\[\]]/g, ""), 10)
//         return sources?.[num - 1]
//       }).filter(Boolean)
      
//       return (
//         <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-3 max-w-xs">
//           <p className="font-semibold text-slate-900 mb-2 text-sm">
//             {categoryValue}
//           </p>
//           <div className="flex items-baseline gap-1.5 mb-2">
//             <span className="text-slate-700 text-xs">{measureKey}:</span>
//             <span className="font-semibold text-slate-900 text-sm">
//               {numberFormatter(measureValue)}
//             </span>
//             {sourceText && (
//               <span className="text-blue-600 text-xs">{sourceText}</span>
//             )}
//           </div>
//           {sourceLinks && sourceLinks.length > 0 && (
//             <div className="text-xs text-slate-500 space-y-0.5">
//               {sourceLinks.map((source: Source, sIdx: number) => (
//                 <a
//                   key={sIdx}
//                   href={source.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-600 hover:underline block truncate"
//                   title={source.title}
//                 >
//                   {source.title || source.url}
//                 </a>
//               ))}
//             </div>
//           )}
//         </div>
//       )
//     }
    
//     // Bar/Line/Area Chart의 경우
//     return (
//       <div className="bg-white border border-slate-300 rounded-lg shadow-lg p-3 max-w-xs">
//         {/* 인덱스 값 (연도, 월 등) */}
//         <p className="font-semibold text-slate-900 mb-2 text-sm">
//           {data[chartIndex]}
//         </p>
        
//         {/* 각 카테고리 값과 출처 */}
//         <div className="space-y-1.5">
//           {payload.map((entry: any, idx: number) => {
//             const categoryName = entry.name
//             const categoryValue = entry.value
//             const sourceField = `${categoryName}_출처`
//             const sourceText = data[sourceField] || ""
            
//             // 출처 번호에서 실제 출처 정보 추출
//             const sourceNumbers = sourceText.match(/\[(\d+)\]/g)
//             const sourceLinks = sourceNumbers?.map((match: string) => {
//               const num = parseInt(match.replace(/[\[\]]/g, ""), 10)
//               return sources?.[num - 1]
//             }).filter(Boolean)
            
//             return (
//               <div key={idx} className="flex items-start gap-2">
//                 {/* 색상 인디케이터 */}
//                 <div 
//                   className="w-3 h-3 rounded-sm mt-0.5 flex-shrink-0" 
//                   style={{ backgroundColor: entry.color }}
//                 />
//                 <div className="flex-1 min-w-0">
//                   {/* 카테고리명과 값 */}
//                   <div className="flex items-baseline gap-1.5">
//                     <span className="text-slate-700 text-xs">{categoryName}:</span>
//                     <span className="font-semibold text-slate-900 text-sm">
//                       {numberFormatter(categoryValue)}
//                     </span>
//                     {sourceText && (
//                       <span className="text-blue-600 text-xs">{sourceText}</span>
//                     )}
//                   </div>
                  
//                   {/* 출처 링크 */}
//                   {sourceLinks && sourceLinks.length > 0 && (
//                     <div className="mt-1 text-xs text-slate-500">
//                       {sourceLinks.map((source: Source, sIdx: number) => (
//                         <a
//                           key={sIdx}
//                           href={source.url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-blue-600 hover:underline block truncate"
//                           title={source.title}
//                         >
//                           {source.title || source.url}
//                         </a>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       </div>
//     )
//   }

//   const renderFallback = (message: string) => (
//     <Card className="border-slate-200 shadow-none">
//       <Text className="text-xs text-slate-500">{message}</Text>
//     </Card>
//   )

//   if (!data || data.length === 0) {
//     return renderFallback("시각화 데이터가 없어 차트를 표시할 수 없습니다.")
//   }

//   if (validationError) {
//     return renderFallback(`시각화 데이터 오류: ${validationError}`)
//   }

//   // [수정] 타입스크립트 에러 방지: sanitizedData가 undefined일 경우 빈 배열 할당
//   const finalData = sanitizedData || []

//   // Tremor v3 DonutChart
//   if (component === "DonutChart") {
//     const measureKey = chartCategories[0]
//     // 도넛 차트의 범례 카테고리는 데이터의 index 값들임
//     const donutLegendCategories = finalData.map(item => item[chartIndex])
//     const chartColors = colors && colors.length > 0 ? colors : ["blue", "emerald", "violet", "amber", "gray", "cyan", "pink", "indigo"]
    
//     return (
//       <Card className="border border-slate-200 shadow-sm rounded-xl p-6 bg-white overflow-hidden">
//         <div className="flex justify-center mb-2">
//           <Title className="text-lg font-bold text-[#4D5D71]">{chartTitle}</Title>
//         </div>
//         <div className="flex justify-center mb-6">
//           <Legend
//             categories={donutLegendCategories}
//             colors={chartColors}
//             className="[&>div]:gap-1 [&_svg]:mr-1 [&_span]:ml-1"
//           />
//         </div>
//         <DonutChart
//           data={finalData}
//           category={measureKey}
//           index={chartIndex}
//           valueFormatter={numberFormatter}
//           colors={chartColors}
//           className="mt-2 h-48"
//           customTooltip={customTooltip}
//         />
//       </Card>
//     )
//   }

//   // Bar, Line, Area Chart
//   const commonProps = {
//     data: finalData,
//     index: chartIndex,
//     categories: chartCategories,
//     colors: colors,
//     valueFormatter: numberFormatter,
//     className: "mt-4 h-72 pr-4", // 우측 여백(pr-4) 추가
//     customTooltip: customTooltip,
//     yAxisWidth: 80, // Y축 라벨이 잘리지 않도록 너비 확보
//   }

//   const ChartWrapper = ({ children, title }: { children: React.ReactNode, title: string }) => (
//     <Card className="border border-slate-200 shadow-sm rounded-xl p-6 bg-white overflow-hidden">
//       <div className="flex justify-center mb-4">
//         <Title className="text-lg font-bold text-[#4D5D71]">{title}</Title>
//       </div>
//       {children}
//     </Card>
//   )

//   switch (component) {
//     case "BarChart":
//       return (
//         <ChartWrapper title={chartTitle}>
//           <BarChart {...commonProps} />
//         </ChartWrapper>
//       )
//     case "LineChart":
//       return (
//         <ChartWrapper title={chartTitle}>
//           <LineChart {...commonProps} />
//         </ChartWrapper>
//       )
//     case "AreaChart":
//       return (
//         <ChartWrapper title={chartTitle}>
//           <AreaChart {...commonProps} />
//         </ChartWrapper>
//       )
//     default:
//       return renderFallback(`${component} 타입 차트가 지원되지 않습니다.`)
//   }
// }

// const createMarkdownComponents = (sources: Source[] = [], onTableCopy?: () => void): Components => ({
//   h1: ({ children, ...props }: any) => (
//     <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">
//       {children}
//     </h3>
//   ),
//   h2: ({ children, ...props }: any) => (
//     <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">
//       {children}
//     </h3>
//   ),
//   h3: ({ children, ...props }: any) => (
//     <h3 {...props} className="text-[16px] font-extrabold text-[#354355] mt-4 mb-2">
//       {children}
//     </h3>
//   ),
//   h4: ({ children, ...props }: any) => (
//     <h4 {...props} className="text-base font-bold text-[#354355] mt-3 mb-1">
//       {children}
//     </h4>
//   ),
//   p: ({ children, ...props }: any) => (
//     <div {...props} className="mb-2 leading-6 font-medium text-[#334155] text-sm">
//       {children}
//     </div>
//   ),
//   ul: ({ children, ...props }: any) => (
//     <ul {...props} className="list-disc font-medium list-outside mb-4 space-y-1 ml-5">
//       {children}
//     </ul>
//   ),
//   ol: ({ children, ...props }: any) => (
//     <ol {...props} className="list-decimal font-medium list-outside mb-4 space-y-1 ml-5">
//       {children}
//     </ol>
//   ),
//   li: ({ children, ...props }: any) => (
//     <li {...props} className="leading-6 font-medium text-[#334155] text-sm">
//       {children}
//     </li>
//   ),
//   strong: ({ children, ...props }: any) => (
//     <strong {...props} className="font-semibold text-slate-900">
//       {children}
//     </strong>
//   ),
//   em: ({ children, ...props }: any) => (
//     <em {...props} className="italic">
//       {children}
//     </em>
//   ),
//   code: ({ children, className, ...props }: any) => {
//     const isInline = !className
//     return isInline ? (
//       <code {...props} className="bg-slate-100 text-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">
//         {children}
//       </code>
//     ) : (
//       <code {...props} className={className}>
//         {children}
//       </code>
//     )
//   },
//   pre: ({ children, ...props }: any) => (
//     <pre {...props} className="bg-slate-100 border border-slate-300 rounded p-4 overflow-x-auto mb-4">
//       {children}
//     </pre>
//   ),
//   blockquote: ({ children, ...props }: any) => (
//     <blockquote
//       {...props}
//       className="border-l-4 border-slate-300 pl-4 italic my-4 text-slate-600"
//     >
//       {children}
//     </blockquote>
//   ),
//   a: ({ href, children, className, ...props }: any) => {
//     const childrenStr = String(children)
//     const groupMatch = childrenStr.match(/^CITATION_GROUP_(.+)$/)
    
//     if (groupMatch) {
//       const indexStrings = groupMatch[1].split("_")
//       const indices = indexStrings.map(s => parseInt(s, 10))
//       const firstIndex = indices[0]
//       const firstSource = sources[firstIndex - 1]
      
//       if (firstSource) {
//         // 도메인 추출 함수
//         const getDomainFromUrl = (url?: string) => {
//           if (!url) return null
//           try {
//             const urlObj = new URL(url)
//             return urlObj.hostname.replace("www.", "")
//           } catch { return null }
//         }

//         // 표시 텍스트 결정: "도메인 +N"
//         const domain = getDomainFromUrl(firstSource.url) || "출처"
//         const displayText = indices.length > 1 
//           ? `${domain} +${indices.length - 1}`
//           : domain

//         return (
//           <Tooltip delayDuration={0}>
//             <TooltipTrigger asChild>
//               <a
//                 href={href}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-flex items-center bg-[#F1F5F9] text-[#64748B] px-1 py-0 rounded-full text-[9px] font-semibold hover:bg-[#E2E8F0] transition-colors cursor-pointer relative z-10 mx-0.5 align-middle mb-0.5"
//                 {...props}
//               >
//                 {displayText}
//               </a>
//             </TooltipTrigger>
//             <TooltipContent 
//               className="w-80 p-0 bg-white border border-slate-200 shadow-lg pointer-events-auto overflow-hidden" 
//               side="top"
//               sideOffset={4}
//             >
//               <div className="max-h-60 overflow-y-auto">
//                 {indices.map((idx, i) => {
//                   const s = sources[idx - 1]
//                   if (!s) return null
                  
//                   const getDomainFromUrl = (url?: string) => {
//                     if (!url) return null
//                     try {
//                       const urlObj = new URL(url)
//                       return urlObj.hostname.replace("www.", "")
//                     } catch { return null }
//                   }
//                   const domain = getDomainFromUrl(s.url)
//                   const faviconUrl = domain 
//                     ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
//                     : null

//                   return (
//                     <a
//                       key={i}
//                       href={s.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors group"
//                     >
//                       {faviconUrl ? (
//                         <img 
//                           src={faviconUrl} 
//                           alt="" 
//                           className="w-4 h-4 flex-shrink-0"
//                           onError={(e) => { e.currentTarget.style.display = 'none' }}
//                         />
//                       ) : (
//                         <span className="text-slate-400 w-4 h-4 flex-shrink-0 text-[10px]">🌐</span>
//                       )}
//                       <div className="flex-1 min-w-0">
//                         <div className="text-[11px] font-semibold text-slate-900 truncate group-hover:text-blue-600">
//                           {s.title || "제목 없음"}
//                         </div>
//                         {s.url && (
//                           <div className="text-[10px] text-slate-500 truncate">{s.url}</div>
//                         )}
//                       </div>
//                     </a>
//                   )
//                 })}
//               </div>
//             </TooltipContent>
//           </Tooltip>
//         )
//       }
//     }
    
//     return (
//       <a
//         href={href}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="text-blue-600 underline hover:text-blue-800"
//         {...props}
//       >
//         {children}
//       </a>
//     )
//   },
//   table: ({ children, ...props }: any) => {
//     const [isHovered, setIsHovered] = useState(false)
//     const [isCopied, setIsCopied] = useState(false)
    
//     const handleCopyTable = async (e: React.MouseEvent) => {
//       e.preventDefault()
//       e.stopPropagation()
      
//       try {
//         // 표를 텍스트로 변환
//         const table = e.currentTarget.closest('div')?.querySelector('table')
//         if (!table) return
        
//         let text = ''
//         const rows = table.querySelectorAll('tr')
        
//         rows.forEach((row, rowIndex) => {
//           const cells = row.querySelectorAll('th, td')
//           const rowText = Array.from(cells).map(cell => {
//             return cell.textContent?.trim() || ''
//           }).join('\t')
//           text += rowText + '\n'
//         })
        
//         // 클립보드에 복사
//         await navigator.clipboard.writeText(text.trim())
//         setIsCopied(true)
//         onTableCopy?.()
        
//         // 2초 후 복사 상태 초기화
//         setTimeout(() => {
//           setIsCopied(false)
//         }, 2000)
//       } catch (error) {
//         console.error('표 복사 실패:', error)
//       }
//     }
    
//     return (
//       <div 
//         className="relative overflow-hidden mb-6 my-6 group bg-white border border-slate-200 rounded-xl shadow-sm"
//         onMouseEnter={() => setIsHovered(true)}
//         onMouseLeave={() => setIsHovered(false)}
//       >
//         <div className="overflow-x-auto">
//           <table {...props} className="w-full border-collapse">
//             {children}
//           </table>
//         </div>
//         {isHovered && (
//           <button
//             onClick={handleCopyTable}
//             className="absolute top-2 right-2 z-10 p-2 bg-white border border-slate-300 rounded-md shadow-md hover:bg-slate-50 transition-all flex items-center justify-center"
//             title="표 복사"
//           >
//             {isCopied ? (
//               <Check className="w-4 h-4 text-green-600" />
//             ) : (
//               <Copy className="w-4 h-4 text-slate-600" />
//             )}
//           </button>
//         )}
//       </div>
//     )
//   },
//   thead: ({ children, ...props }: any) => (
//     <thead {...props} className="bg-[#f8fafc]">
//       {children}
//     </thead>
//   ),
//   tbody: ({ children, ...props }: any) => <tbody {...props} className="bg-white">{children}</tbody>,
//   tr: ({ children, ...props }: any) => (
//     <tr {...props} className="border-b border-slate-100 last:border-0">
//       {children}
//     </tr>
//   ),
//   th: ({ children, ...props }: any) => (
//     <th {...props} className="px-6 py-3 text-left text-xs font-bold text-[#4D5D71] border-r border-slate-100 last:border-0">
//       {children}
//     </th>
//   ),
//   td: ({ children, ...props }: any) => (
//     <td {...props} className="px-6 py-3 text-sm text-[#334155] border-r border-slate-100 last:border-0 font-medium">
//       {children}
//     </td>
//   ),
//   hr: () => <hr className="my-6 border-slate-300" />,
// })

// export default function FactbookDetailPage() {
//   const params = useParams()
//   const router = useRouter()
//   const [factbook, setFactbook] = useState<FactbookDetail | null>(null)
//   const [activeSection, setActiveSection] = useState<string>("")
//   const [expandedSection, setExpandedSection] = useState<string | undefined>(undefined) // Accordion에서 열린 섹션
//   const [activeTab, setActiveTab] = useState<"factbook" | "links" | "images" | "media">("factbook")
//   const [sourceTab, setSourceTab] = useState<"source" | "image">("source") // 출처/이미지 탭 (기존 사이드바용, 유지)
//   const [showScrollButton, setShowScrollButton] = useState(false)
//   const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
//   const [failedImages, setFailedImages] = useState<Set<string>>(new Set()) // 로드 실패한 이미지 URL 저장
//   const [isManualScroll, setIsManualScroll] = useState(false) // 수동 스크롤 여부
//   const [isDeleting, setIsDeleting] = useState(false)
//   const mainContentRef = useRef<HTMLDivElement>(null) // 메인 콘텐츠 스크롤 컨테이너 ref
//   const { toast } = useToast()

//   useEffect(() => {
//     const fetchFactbook = async () => {
//       try {
//         const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
//         const response = await fetch(`${backendUrl}/api/factbooks/${params.id}`)
        
//         if (!response.ok) {
//           if (response.status === 404) {
//             toast({
//               title: "팩트북을 찾을 수 없습니다.",
//               variant: "destructive",
//             })
//             return
//           }
//           throw new Error("팩트북 조회 실패")
//         }
        
//         const data = await response.json()
        
//         // 백엔드 응답 형식을 프론트엔드 형식으로 변환
//         const factbook: FactbookDetail = {
//           id: String(data.id),
//           companyName: data.company_name || "",
//           productName: data.product_name || "",
//           category: data.category || "",
//           sections: (data.sections || []).map((section: any) => {
//             // 백엔드 데이터 키값 확인 (sub_sections 우선 체크)
//             const rawSubSections = section.subSections || section.sub_sections || [];
  
//             const subSectionsWithSources = rawSubSections.map((subSection: any) => {
//               const { cleanedContent, visualizations } = parseVisualizations(subSection.content || "")
//               const rawSources = subSection.sources || subSection.source_list || [];
//               return {
//               id: subSection.id || "",
//               title: subSection.title || "",
//                 content: cleanedContent,
//                 visualizations,
//               sources: (subSection.sources || []).map((source: any) => ({
//                 title: source.title || "",
//                 content: source.content || "",
//                 media: source.media || "",
//                 url: source.url || "",
//                 imageUrl: source.imageUrl || undefined,
//               })),
//               }
//             })

//             // section 레벨의 sources는 모든 subSection의 sources를 flatMap (계산용)
//             const allSources: Source[] = subSectionsWithSources.flatMap(
//               (subSection: SubSection) => subSection.sources || []
//             )

//             return {
//               id: String(section.id),
//               title: section.title || "",
//               subSections: subSectionsWithSources,
//               sources: allSources, // 계산용으로 유지
//             }
//           }),
//         }
        
//         setFactbook(factbook)
        
//         // 첫 번째 섹션을 기본 활성화
//         if (factbook.sections.length > 0 && factbook.sections[0].subSections.length > 0) {
//           const firstSubSectionId = factbook.sections[0].subSections[0].id
//           setActiveSection(firstSubSectionId)
//           setExpandedSection(factbook.sections[0].id) // 첫 번째 섹션 열기
//         }
//       } catch (error) {
//         console.error("팩트북 조회 실패:", error)
//         toast({
//           title: "팩트북을 불러오는데 실패했습니다.",
//           variant: "destructive",
//         })
//       }
//     }
    
//     if (params.id) {
//       fetchFactbook()
//     }
//   }, [params.id, toast])

//   useEffect(() => {
//     const mainContent = mainContentRef.current
//     if (!mainContent) return

//     let ticking = false
//     const handleScroll = () => {
//       if (!ticking) {
//         window.requestAnimationFrame(() => {
//           // 메인 콘텐츠 div의 스크롤이 최상단(0)이 아닐 때만 버튼 표시
//           setShowScrollButton(mainContent.scrollTop > 0)
//           ticking = false
//         })
//         ticking = true
//       }
//     }
//     mainContent.addEventListener("scroll", handleScroll, { passive: true })

//     // 초기 상태 확인
//     handleScroll()
    
//     return () => mainContent.removeEventListener("scroll", handleScroll)
//   }, [factbook]) // factbook이 로드된 후에도 다시 설정

//   // activeSection이 변경될 때 해당 섹션이 자동으로 열리도록
//   useEffect(() => {
//     if (!factbook) return
    
//     const currentSection = factbook.sections.find((s) => 
//       s.subSections.some((ss) => ss.id === activeSection)
//     )
    
//     if (currentSection) {
//       setExpandedSection(currentSection.id)
//     }
//   }, [activeSection, factbook])

//   // Intersection Observer로 현재 보이는 섹션 감지
//   useEffect(() => {
//     if (!factbook || activeTab !== "factbook") return

//     // 수동 스크롤 중이면 observer 비활성화
//     if (isManualScroll) {
//       const timer = setTimeout(() => {
//         setIsManualScroll(false)
//       }, 1000)
//       return () => clearTimeout(timer)
//     }

//     const observerOptions = {
//       root: null,
//       rootMargin: "-20% 0px -60% 0px", // 화면 상단 20% ~ 하단 60% 영역
//       threshold: 0,
//     }

//     const sectionElements: { element: HTMLElement; id: string }[] = []
//     const visibilityMap = new Map<string, number>()

//     // 모든 섹션 요소 수집
//     factbook.sections.forEach((section) => {
//       section.subSections.forEach((subSection) => {
//         const element = document.getElementById(`section-${subSection.id}`)
//         if (element) {
//           sectionElements.push({ element, id: subSection.id })
//         }
//       })
//     })

//     if (sectionElements.length === 0) return

//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         const sectionId = entry.target.id.replace("section-", "")
//         if (entry.isIntersecting) {
//           // 화면에 보이는 영역의 비율 계산
//           const rect = entry.boundingClientRect
//           const viewportHeight = window.innerHeight
//           const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0)
//           const visibility = Math.max(0, visibleHeight / viewportHeight)
//           visibilityMap.set(sectionId, visibility)
//         } else {
//           visibilityMap.delete(sectionId)
//         }
//       })

//       // 가장 많이 보이는 섹션 찾기
//       if (visibilityMap.size > 0 && !isManualScroll) {
//         let maxVisibility = 0
//         let mostVisibleSection = ""
        
//         visibilityMap.forEach((visibility, sectionId) => {
//           if (visibility > maxVisibility) {
//             maxVisibility = visibility
//             mostVisibleSection = sectionId
//           }
//         })

//         if (mostVisibleSection && mostVisibleSection !== activeSection) {
//           setActiveSection(mostVisibleSection)
//         }
//       }
//     }, observerOptions)

//     // 모든 섹션 observe
//     sectionElements.forEach(({ element }) => {
//       observer.observe(element)
//     })

//     return () => {
//       sectionElements.forEach(({ element }) => {
//         observer.unobserve(element)
//       })
//     }
//   }, [factbook, activeTab, isManualScroll, activeSection])

//   const handleShare = () => {
//     navigator.clipboard.writeText(window.location.href)
//     toast({
//       title: "공유 링크가 복사되었습니다.",
//       duration: 1000,
//     })
//   }

//   const handleCopy = () => {
//     navigator.clipboard.writeText(window.location.href)
//     toast({
//       title: "링크가 복사되었습니다.",
//       duration: 1000,
//     })
//   }

//   const handleTableCopy = () => {
//     toast({
//       title: "표가 복사되었습니다.",
//       duration: 2000,
//     })
//   }

//   const handleDelete = async () => {
//     if (!confirm("팩트북을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
//       return
//     }

//     setIsDeleting(true)
//     try {
//       const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
//       const response = await fetch(`${backendUrl}/api/factbooks/${params.id}`, {
//         method: "DELETE",
//       })

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({ detail: "삭제 실패" }))
//         throw new Error(errorData.detail || "팩트북 삭제에 실패했습니다.")
//       }

//       toast({
//         title: "팩트북이 삭제되었습니다.",
//         duration: 2000,
//       })

//       // 메인 페이지로 리다이렉트
//       setTimeout(() => {
//         router.push("/")
//       }, 500)
//     } catch (error) {
//       console.error("팩트북 삭제 실패:", error)
//       toast({
//         title: "팩트북 삭제에 실패했습니다.",
//         description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
//         variant: "destructive",
//       })
//     } finally {
//       setIsDeleting(false)
//     }
//   }

//   const handleExport = async () => {
//     if (!factbook) return
    
//     try {
//       toast({
//         title: "문서를 생성하는 중입니다...",
//         duration: 2000,
//       })
      
//       await exportFactbookToWord(factbook)
      
//       toast({
//         title: "문서가 다운로드되었습니다.",
//         duration: 2000,
//       })
//     } catch (error) {
//       console.error("문서 내보내기 실패:", error)
//       toast({
//         title: "문서 내보내기에 실패했습니다.",
//         description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
//         variant: "destructive",
//       })
//     }
//   }

//   const handleScrollToTop = () => {
//     // 메인 콘텐츠 div를 최상단으로 스크롤
//     if (mainContentRef.current) {
//       mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" })
//     }
//   }

//   // 본문의 [숫자] 패턴을 출처 URL 링크로 변환 (마크다운 링크 형식)
//   const convertCitationLinks = (content: string, sources: Source[] = []): string => {
//     if (!sources || sources.length === 0) {
//       return content
//     }

//     // 연속된 [숫자] 패턴을 찾아서 하나의 그룹으로 변환 (예: [1][2] -> [CITATION_GROUP_1_2](url))
//     return content.replace(/(?:\[(\d+)\])+/g, (match) => {
//       const indices = [...match.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1], 10))
//       const validIndices = indices.filter(idx => idx > 0 && idx <= sources.length)
      
//       if (validIndices.length === 0) return match
      
//       // 첫 번째 유효한 출처의 URL을 대표 링크로 사용
//       const firstUrl = sources[validIndices[0] - 1]?.url || "#"
//       // 특수 마커를 사용하여 나중에 컴포넌트에서 통합 배지로 변환
//       return `[CITATION_GROUP_${validIndices.join("_")}](${firstUrl})`
//     })
//   }

//   // 특수문자가 포함된 볼드체를 올바르게 파싱하기 위한 전처리
//   const preprocessMarkdown = (content: string): string => {
//     // ReactMarkdown이 제대로 파싱하지 못하는 볼드체 패턴들을 <strong> 태그로 변환
//     let processed = content
    
//     // 특수문자 패턴: 괄호, %, 따옴표, 기타 등등
//     const hasSpecialChars = (text: string) => /[()%"'`~!@#$^&+=\[\]{}|\\:;<>,?/]/.test(text)
    
//     // 모든 **텍스트** 패턴을 찾아서 특수문자가 있으면 <strong>으로 변환
//     // 더 포괄적인 패턴 사용
//     processed = processed.replace(/\*\*([^*\n]+?)\*\*/g, (match, text) => {
//       if (hasSpecialChars(text)) {
//         return `<strong>${text}</strong>`
//       }
//       return match
//     })
    
//     return processed
//   }

//   const renderContentWithCharts = (subSection: SubSection) => {
//     const content = subSection.content || ""
//     const visualizations = subSection.visualizations || []
//     const sources = subSection.sources || []
//     const regex = /\{\{([A-Z0-9_]+)\}\}/g
//     const nodes: ReactNode[] = []
//     const usedChartIds = new Set<string>()
//     let lastIndex = 0
//     let match: RegExpExecArray | null

//     while ((match = regex.exec(content)) !== null) {
//       const textSegment = content.slice(lastIndex, match.index)
//       if (textSegment.trim()) {
//         nodes.push(
//           <ReactMarkdown
//             key={`md-${subSection.id}-${match.index}`}
//             remarkPlugins={[remarkGfm]}
//             rehypePlugins={[rehypeRaw]}
//             components={createMarkdownComponents(sources, handleTableCopy)}
//           >
//             {preprocessMarkdown(convertCitationLinks(textSegment, sources))}
//           </ReactMarkdown>
//         )
//       }

//       const chartId = match[1]
//       const viz = visualizations.find((v) => v.id === chartId)
//       if (viz) {
//         usedChartIds.add(chartId)
//       }
//       nodes.push(
//         <div key={`chart-${subSection.id}-${chartId}-${match.index}`} className="my-4">
//           {viz ? (
//             <>
//               {console.log("renderContentWithCharts: renderChartComponent 호출, viz:", viz)}
//               {renderChartComponent(viz, sources)}
//             </>
//           ) : (
//             <div className="text-xs text-slate-500 italic border border-dashed border-slate-300 rounded p-3">
//               {`시각화 데이터(${chartId})를 찾을 수 없습니다.`}
//             </div>
//           )}
//         </div>
//       )

//       lastIndex = regex.lastIndex
//     }

//     const remaining = content.slice(lastIndex)
//     if (remaining.trim() || nodes.length === 0) {
//       nodes.push(
//         <ReactMarkdown
//           key={`md-${subSection.id}-last`}
//           remarkPlugins={[remarkGfm]}
//           rehypePlugins={[rehypeRaw]}
//           components={createMarkdownComponents(sources)}
//         >
//           {preprocessMarkdown(convertCitationLinks(remaining, sources))}
//         </ReactMarkdown>
//       )
//     }

//     // 만약 본문에 {{CHART_ID}}를 넣지 않아도, 응답 JSON에 있는 차트를 모두 노출
//     const unusedVisualizations = visualizations.filter((viz) => !usedChartIds.has(viz.id))
//     if (unusedVisualizations.length > 0) {
//       unusedVisualizations.forEach((viz) => {
//         nodes.push(
//           <div key={`chart-${subSection.id}-${viz.id}-fallback`} className="my-4">
//             {renderChartComponent(viz, sources)}
//           </div>
//         )
//       })
//     }

//     return <div className="space-y-4">{nodes}</div>
//   }

//   const handleSubSectionClick = (subSectionId: string) => {
//     setActiveSection(subSectionId)
//     // 섹션 변경 시 이미지 뷰어 닫기
//     setSelectedImageIndex(null)
//     // 수동 스크롤 시작
//     setIsManualScroll(true)
//     const element = document.getElementById(`section-${subSectionId}`)
//     if (element) {
//       // 스크롤 인터랙션 없이 바로 이동
//       element.scrollIntoView({ behavior: "auto", block: "start" })
//     }
//   }

//   const handleSectionClick = (sectionId: string) => {
//     const section = factbook?.sections.find((s) => s.id === sectionId)
//     if (!section) return

//     // 수동 스크롤 시작
//     setIsManualScroll(true)
//     setSelectedImageIndex(null)

//     // 대분류 헤더 위치로 이동
//     const element = document.getElementById(`section-main-${sectionId}`)
//     if (element) {
//       element.scrollIntoView({ behavior: "auto", block: "start" })
//     }

//     // 사이드바 하이라이트를 위해 첫 번째 중분류를 활성 섹션으로 설정
//     if (section.subSections.length > 0) {
//       setActiveSection(section.subSections[0].id)
//     }
//   }

//   if (!factbook) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <div className="flex flex-col items-center gap-4">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//           <div className="text-slate-600">팩트북을 불러오는 중...</div>
//         </div>
//       </div>
//     )
//   }

//   // 활성화된 섹션의 출처와 이미지 가져오기
//   const getActiveSectionData = () => {
//     if (!factbook) {
//       return { sources: [], images: [] }
//     }
    
//     // activeSection (예: "1-1")에 해당하는 subSection 찾기
//     let activeSubSection: SubSection | null = null
    
//     for (const section of factbook.sections) {
//       const subSection = section.subSections.find((ss) => ss.id === activeSection)
//       if (subSection) {
//         activeSubSection = subSection
//         break
//       }
//     }
    
//     if (!activeSubSection || !activeSubSection.sources) {
//       return { sources: [], images: [] }
//     }
    
//     // 해당 subSection의 sources 사용
//     const sources = activeSubSection.sources || []
//     const images = sources.filter((s) => s.imageUrl).map((s) => s.imageUrl!)
    
//     return { sources, images }
//   }

//   const { sources: activeSources, images: activeImages } = getActiveSectionData()

//   // 섹션 제목에 따른 아이콘 매핑
//   const getSectionIcon = (title: string) => {
//     if (title.includes("기업")) return <Building2 className="w-4 h-4" />
//     if (title.includes("시장")) return <Globe className="w-4 h-4" />
//     if (title.includes("자사")) return <Star className="w-4 h-4" />
//     if (title.includes("경쟁")) return <Search className="w-4 h-4" />
//     if (title.includes("타겟")) return <Target className="w-4 h-4" />
//     if (title.includes("소재")) return <Tv className="w-4 h-4" />
//     return <FileSearch className="w-4 h-4" />
//   }

//   // 모든 섹션에서 모든 출처와 이미지를 통합해서 가져오기
//   const getAllFactbookData = () => {
//     if (!factbook) return { allSources: [], allImages: [] }
    
//     const allSourcesMap = new Map<string, Source>()
//     const allImagesList: { imageUrl: string, sourceUrl?: string }[] = []
//     const seenImageUrls = new Set<string>()
    
//     factbook.sections.forEach(section => {
//       section.subSections.forEach(subSection => {
//         subSection.sources?.forEach(source => {
//           if (source.url) {
//             allSourcesMap.set(source.url, source)
//           }
//           if (source.imageUrl && !seenImageUrls.has(source.imageUrl)) {
//             seenImageUrls.add(source.imageUrl)
//             allImagesList.push({
//               imageUrl: source.imageUrl,
//               sourceUrl: source.url
//             })
//           }
//         })
//       })
//     })
    
//     return {
//       allSources: Array.from(allSourcesMap.values()),
//       allImages: allImagesList
//     }
//   }

//   const { allSources, allImages } = getAllFactbookData()

//   const handleImageClick = (imageUrl: string) => {
//     const currentImages = activeTab === "images" ? allImages.map(img => img.imageUrl) : activeImages
//     const index = currentImages.indexOf(imageUrl)
//     if (index !== -1) {
//       setSelectedImageIndex(index)
//     }
//   }

//   const handleCloseImageViewer = () => {
//     setSelectedImageIndex(null)
//   }

//   const handlePreviousImage = () => {
//     if (selectedImageIndex !== null && selectedImageIndex > 0) {
//       setSelectedImageIndex(selectedImageIndex - 1)
//     }
//   }

//   const handleNextImage = () => {
//     const currentImages = activeTab === "images" ? allImages.map(img => img.imageUrl) : activeImages
//     if (selectedImageIndex !== null && selectedImageIndex < currentImages.length - 1) {
//       setSelectedImageIndex(selectedImageIndex + 1)
//     }
//   }

//   return (
//     <TooltipProvider delayDuration={0} skipDelayDuration={2000}>
//       <div className="min-h-screen bg-white" style={{ fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif' }}>
//         {/* 헤더 */}
//         <header className="sticky top-0 bg-white border-b border-slate-200 z-50">
//           <div className="max-w-full px-6 py-4">
//             <div className="flex items-center justify-between">
//               {/* 왼쪽: 뒤로가기, 회사명 */}
//               <div className="flex items-center gap-4 flex-1">
//                 <Link href="/">
//                   <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900">
//                     <ArrowLeft className="w-5 h-5" />
//                   </Button>
//                 </Link>

//                 <h1 className="text-base text-l font-bold text-[#475569]">
//                   {factbook.companyName} {factbook.productName} FactBook
//                 </h1>
//               </div>

//               {/* 오른쪽: 메뉴 버튼들 */}
//               <div className="flex items-center gap-6">
//                 <button
//                   onClick={() => {
//                     setActiveTab("factbook");
//                     setSourceTab("source");
//                     setSelectedImageIndex(null);
//                   }}
//                   className={`flex items-center gap-2 px-1 py-2 text-sm font-medium transition-colors border-b-2 ${
//                     activeTab === "factbook"
//                       ? "text-[#1e293b] border-[#1e293b]"
//                       : "text-slate-500 border-transparent hover:text-slate-800"
//                   }`}
//                 >
//                   <FileSearch className="w-5 h-5" />
//                   <span>팩트북</span>
//                 </button>

//                 <button
//                   className="flex items-center gap-2 px-1 py-2 text-sm font-medium text-slate-300 cursor-not-allowed border-b-2 border-transparent"
//                   disabled
//                 >
//                   <Folder className="w-5 h-5" />
//                   <span>파일</span>
//                 </button>

//                 <button
//                   onClick={() => {
//                     setActiveTab("links");
//                     setSelectedImageIndex(null);
//                   }}
//                   className={`flex items-center gap-2 px-1 py-2 text-sm font-medium transition-colors border-b-2 ${
//                     activeTab === "links"
//                       ? "text-[#1e293b] border-[#1e293b]"
//                       : "text-slate-500 border-transparent hover:text-slate-800"
//                   }`}
//                 >
//                   <Link2 className="w-5 h-5" />
//                   <span>링크</span>
//                 </button>

//                 <button
//                   onClick={() => {
//                     setActiveTab("images");
//                     setSelectedImageIndex(null);
//                   }}
//                   className={`flex items-center gap-2 px-1 py-2 text-sm font-medium transition-colors border-b-2 ${
//                     activeTab === "images"
//                       ? "text-[#1e293b] border-[#1e293b]"
//                       : "text-slate-500 border-transparent hover:text-slate-800"
//                   }`}
//                 >
//                   <ImageIcon className="w-5 h-5" />
//                   <span>이미지</span>
//                 </button>
//               </div>
//             </div>
//           </div>
//         </header>

//       <div className="flex h-[calc(100vh-65px)] overflow-hidden">
//         {/* 팩트북 탭일 때만 목차 사이드바 표시 */}
//         {activeTab === "factbook" && (
//           <aside className="w-72 border-r border-slate-200 bg-[#f8fafc] flex flex-col flex-shrink-0 overflow-hidden">
//             {/* 상단 목차 영역 */}
//             <div className="flex-1 overflow-y-auto p-6">
//               <div className="flex items-center gap-2 mb-2">
//                 <h3 className="font-bold text-[#64748b] text-s tracking-wider uppercase">목차</h3>
//               </div>

//               <Accordion 
//                 type="single" 
//                 collapsible 
//                 className="w-full space-y-2"
//                 value={expandedSection}
//                 onValueChange={setExpandedSection}
//               >
//                 {factbook.sections.map((section, idx) => {
//                   const isExpanded = expandedSection === section.id
//                   const hasActiveSubSection = section.subSections.some((ss) => ss.id === activeSection)
                  
//                   return (
//                     <AccordionItem 
//                       key={section.id} 
//                       value={section.id}
//                       className={`border-none rounded-xl transition-all duration-200 ${
//                         isExpanded ? "bg-white shadow-sm ring-1 ring-slate-200" : ""
//                       }`}
//                     >
//                       <AccordionPrimitive.Header className="flex">
//                         <button
//                           onClick={() => handleSectionClick(section.id)}
//                           className={`flex flex-1 items-center gap-3 text-left py-3 px-4 transition-colors ${
//                             isExpanded || hasActiveSubSection ? "text-[#1e293b]" : "text-[#64748b]"
//                           }`}
//                         >
//                           <span className={`${isExpanded || hasActiveSubSection ? "text-[#3b82f6]" : "text-[#94a3b8]"}`}>
//                             {getSectionIcon(section.title)}
//                           </span>
//                           <span className={`text-[14px] font-bold ${isExpanded ? "text-[#1e293b]" : ""}`}>
//                             {section.title}
//                           </span>
//                         </button>
//                         <AccordionPrimitive.Trigger
//                           className="flex items-center justify-center pr-4 text-[#94a3b8] transition-transform duration-200 [&[data-state=open]>svg]:rotate-180"
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           <ChevronDown className="h-4 w-4 shrink-0" />
//                         </AccordionPrimitive.Trigger>
//                       </AccordionPrimitive.Header>
                      
//                       <AccordionContent className="pb-3 px-2">
//                         <div className="space-y-1">
//                           {section.subSections.map((subSection, ssIdx) => {
//                             const isActive = activeSection === subSection.id
//                             return (
//                               <button
//                                 key={subSection.id}
//                                 onClick={() => handleSubSectionClick(subSection.id)}
//                                 className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all ${
//                                   isActive
//                                     ? "bg-[#f1f5f9] text-[#1e293b]"
//                                     : "text-[#64748b] hover:bg-slate-50"
//                                 }`}
//                               >
//                                 <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
//                                   isActive ? "bg-[#475569] text-white" : "bg-[#e2e8f0] text-[#94a3b8]"
//                                 }`}>
//                                   {ssIdx + 1}
//                                 </div>
//                                 <span className={`text-[12px] leading-tight ${isActive ? "font-bold" : "font-medium"}`}>
//                                   {subSection.title}
//                                 </span>
//                               </button>
//                             )
//                           })}
//                         </div>
//                       </AccordionContent>
//                     </AccordionItem>
//                   )
//                 })}
//               </Accordion>
//             </div>

//             {/* 하단 메타 정보 영역 */}
//             <div className="px-9 py-5 bg-[#f8fafc]">
//               <div className="w-full h-[1.5px] bg-[#354355] mb-1 opacity-70" />
//               <div className="space-y-2 mb-4">
//                 <table className="w-full text-[11px]">
//                   <tbody className="divide-y divide-slate-200">
//                     <tr className="py-1">
//                       <td className="text-[#94a3b8] py-1 w-16 font-medium">브랜드</td>
//                       <td className="text-[#475569] py-1 font-semibold text-right">{factbook.companyName}</td>
//                     </tr>
//                     <tr className="py-1">
//                       <td className="text-[#94a3b8] py-1 w-16 font-medium">업종</td>
//                       <td className="text-[#475569] py-1 font-semibold text-right">{factbook.category || "기타"}</td>
//                     </tr>
//                     <tr className="py-1">
//                       <td className="text-[#94a3b8] py-1 w-16 font-medium">제품</td>
//                       <td className="text-[#475569] py-1 font-semibold text-right">{factbook.productName}</td>
//                     </tr>
//                     <tr className="py-1 border-t border-dashed border-slate-300">
//                       <td className="text-[#94a3b8] py-1 w-16 font-medium">작성 정보</td>
//                       <td className="text-[#475569] py-1 font-semibold text-right">
//                         {new Date().toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
//                       </td>
//                     </tr>
//                     <tr className="py-1">
//                       <td className="text-[#94a3b8] py-1 w-16 font-medium">입력 정보</td>
//                       <td className="text-[#475569] py-1 font-semibold text-right flex justify-end">
//                         <div className="w-4 h-4 rounded bg-[#e2e8f0] flex items-center justify-center text-[#94a3b8]">
//                           <ExternalLink className="w-2.5 h-2.5" />
//                         </div>
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>

//               <div className="grid grid-cols-2 gap-2">
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={handleShare}
//                   className="h-8 text-[11px] font-bold text-[#64748b] bg-white border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
//                 >
//                   공유하기
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   onClick={handleExport}
//                   className="h-8 text-[11px] font-bold text-[#64748b] bg-white border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
//                 >
//                   내보내기
//                 </Button>
//               </div>
//             </div>
//           </aside>
//         )}

//         {/* 메인 콘텐츠 */}
//         <div ref={mainContentRef} className="flex-1 overflow-y-auto relative bg-white">
//           <div className="p-8 relative">
//             {activeTab === "factbook" ? (
//               <div className="max-w-5xl mx-auto px-12 space-y-12">
//                 {factbook.sections.map((section, sIdx) => (
//                   <div key={section.id} className="space-y-6">
//                     {/* Depth 1: 목차 (H1) */}
//                     <div 
//                       id={`section-main-${section.id}`}
//                       className="bg-[#f8fafc] rounded-xl py-3 px-6 flex items-center gap-4 border border-[#e2e8f0] scroll-mt-8"
//                     >
//                       <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-[#e2e8f0] shadow-sm">
//                         <Search className="w-3.5 h-3.5 text-[#3b82f6]" />
//                       </div>
//                       <h1 className="text-[22px] font-bold text-[#4D5D71]">{section.title}</h1>
//                     </div>

//                     {section.subSections.map((subSection, ssIdx) => (
//                       <section
//                         key={subSection.id}
//                         id={`section-${subSection.id}`}
//                         className="scroll-mt-8"
//                       >
//                         {/* Depth 2: 중분류 (H2) */}
//                         <div className="flex items-center gap-3 mb-3 ml-3">
//                           <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
//                             {ssIdx + 1}
//                           </div>
//                           <h2 className="text-[18px] font-extrabold text-[#354355]">{subSection.title}</h2>
//                         </div>

//                         {/* Depth 3 & 4 (H3 & Contents) via Markdown */}
//                         <div className="space-y-1 pl-11">
//                           <div className="text-[#334155] text-sm leading-relaxed markdown-content">
//                             {renderContentWithCharts(subSection)}
//                           </div>
//                         </div>
//                       </section>
//                     ))}
//                   </div>
//                 ))}
//               </div>
//             ) : activeTab === "links" ? (
//               <div className="max-w-5xl mx-auto px-12">
//                 <h2 className="text-2xl font-bold text-[#4D5D71] mb-10">링크</h2>
                
//                 {/* 참고 링크 Section */}
//                 <div className="mb-6">
//                   <div className="flex items-center gap-3 mb-3 ml-1">
//                     <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[11px] font-bold shrink-0">1</div>
//                     <h3 className="text-[18px] font-extrabold text-[#354355]">참고 링크</h3>
//                   </div>
//                   <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-10 text-center">
//                     <p className="text-slate-500 text-sm font-medium">등록된 참고 링크가 없습니다.</p>
//                   </div>
//                 </div>

//                 {/* 참고 자료 Section */}
//                 <div>
//                   <div className="flex items-center gap-3 mb-3 ml-1">
//                     <div className="w-5 h-5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-[11px] font-bold shrink-0">2</div>
//                     <h3 className="text-[18px] font-extrabold text-[#354355]">수집 링크</h3>
//                   </div>
                  
//                   <div className="space-y-4">
//                     {allSources.length > 0 ? (
//                       allSources.map((source, idx) => {
//                         const getDomainFromUrl = (url: string) => {
//                           try {
//                             const urlObj = new URL(url)
//                             return urlObj.hostname.replace('www.', '')
//                           } catch { return null }
//                         }
//                         const domain = source.url ? getDomainFromUrl(source.url) : null
//                         const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null

//                         return (
//                           <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow flex gap-6">
//                             <div className="flex-1 min-w-0">
//                               <div className="flex items-center gap-2 mb-3">
//                                 {faviconUrl && (
//                                   <img src={faviconUrl} alt="" className="w-5 h-5 flex-shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
//                                 )}
//                                 <span className="text-xs font-medium text-slate-500 truncate">{domain || source.url}</span>
//                               </div>
//                               <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{source.title || "제목 없음"}</h4>
//                               <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">{source.content}</p>
//                               <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
//                                 {source.url}
//                               </a>
//                             </div>
//                             {source.imageUrl && (
//                               <div className="w-32 h-32 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
//                                 <img src={source.imageUrl} alt="" className="w-full h-full object-cover" />
//                               </div>
//                             )}
//                           </div>
//                         )
//                       })
//                     ) : (
//                       <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
//                         <p className="text-slate-500 text-sm">수집된 참고 자료가 없습니다.</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ) : activeTab === "images" ? (
//               <div className="max-w-6xl mx-auto px-12">
//                 <h2 className="text-2xl font-bold text-[#4D5D71] mb-4">이미지</h2>
                
//                 {allImages.length > 0 ? (
//                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//                     {allImages.map((imgData, idx) => {
//                       const getDomainFromUrl = (url?: string) => {
//                         if (!url) return null
//                         try {
//                           const urlObj = new URL(url)
//                           return urlObj.hostname.replace('www.', '')
//                         } catch { return null }
//                       }
//                       const domain = getDomainFromUrl(imgData.sourceUrl)
//                       const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null

//                       return (
//                         <div key={idx} className="flex flex-col gap-2">
//                           <div 
//                             className="aspect-video bg-slate-100 rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative group"
//                             onClick={() => handleImageClick(imgData.imageUrl)}
//                           >
//                             <img src={imgData.imageUrl} alt="" className="w-full h-full object-cover" />
//                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
//                           </div>
//                           {domain && (
//                             <div className="flex items-center gap-1.5 px-1">
//                               {faviconUrl && (
//                                 <img src={faviconUrl} alt="" className="w-3.5 h-3.5 flex-shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
//                               )}
//                               <span className="text-[11px] text-slate-500 truncate">{domain}</span>
//                             </div>
//                           )}
//                         </div>
//                       )
//                     })}
//                   </div>
//                 ) : (
//                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
//                     <p className="text-slate-500 text-sm">수집된 이미지가 없습니다.</p>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <MediaTab factbookId={params.id as string} />
//             )}
//           </div>

//           {/* 맨 위로 스크롤 버튼 - 팩트북 본문 영역 우하단 고정 */}
//           {showScrollButton && (
//             <div className="sticky bottom-8 float-right mr-8" style={{ marginTop: '-4rem' }}>
//               <button
//                 onClick={handleScrollToTop}
//                 className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-all duration-300 opacity-90 hover:opacity-100 z-40"
//                 aria-label="맨 위로 가기"
//               >
//                 <ArrowUp className="w-5 h-5" />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* 팩트북 탭일 때만 출처정보 패널 표시 (현재 디자인 수정을 위해 주석 처리) */}
//         {false && activeTab === "factbook" && (
//           <aside className="w-56 border-l border-slate-300 bg-slate-50 p-6 overflow-y-auto flex-shrink-0">
//             <div className="space-y-6">
//               {/* 출처/이미지 탭 */}
//               <div className="flex border-b border-slate-300">
//                 <button
//                   onClick={() => setSourceTab("source")}
//                   className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
//                     sourceTab === "source"
//                       ? "text-slate-900 border-b-2 border-slate-900"
//                       : "text-slate-500 hover:text-slate-700"
//                   }`}
//                 >
//                   출처
//                 </button>
//                 <div className="w-px bg-slate-300"></div>
//                 <button
//                   onClick={() => setSourceTab("image")}
//                   className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
//                     sourceTab === "image"
//                       ? "text-slate-900 border-b-2 border-slate-900"
//                       : "text-slate-500 hover:text-slate-700"
//                   }`}
//                 >
//                   이미지
//                 </button>
//               </div>

//               {/* 탭 내용 */}
//               {sourceTab === "source" ? (
//                 /* 출처 탭 */
//                 <div>
//                   {activeSection && activeSources.filter((s) => !s.imageUrl && s.url).length > 0 ? (
//                   <div className="space-y-3">
//                       {activeSources
//                         .filter((s) => !s.imageUrl && s.url)
//                       .map((source, idx) => {
//                           // URL에서 도메인 추출
//                           const getDomainFromUrl = (url: string) => {
//                             try {
//                               const urlObj = new URL(url)
//                               return urlObj.hostname.replace('www.', '')
//                             } catch {
//                               return null
//                             }
//                           }
                          
//                           const domain = source.url ? getDomainFromUrl(source.url) : null
//                           const faviconUrl = domain 
//                             ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
//                             : null
                          
//                           return (
//                             <a
//                               key={idx}
//                               href={source.url}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="block bg-white p-3 rounded border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
//                             >
//                               {/* 아이콘 | 제목 (최대 2줄) */}
//                               <div className="flex items-start gap-2 text-xs mb-2">
//                                 {/* 웹사이트 아이콘 */}
//                                 {faviconUrl ? (
//                                   <img 
//                                     src={faviconUrl} 
//                                     alt="" 
//                                     className="w-4 h-4 flex-shrink-0 mt-0.5"
//                                     onError={(e) => {
//                                       e.currentTarget.style.display = 'none'
//                                     }}
//                                   />
//                                 ) : (
//                                   <span className="text-slate-400 w-4 h-4 flex-shrink-0 mt-0.5">🌐</span>
//                                 )}
//                                 {/* 웹사이트 타이틀 */}
//                                 {source.title && (
//                                   <span className="font-semibold text-slate-900 line-clamp-2 flex-1 min-w-0">{source.title}</span>
//                                 )}
//                               </div>
//                               {/* URL (최대 2줄) */}
//                               {source.url && (
//                                 <p className="text-slate-600 text-xs line-clamp-2">{source.url}</p>
//                               )}
//                             </a>
//                           )
//                         })}
//                   </div>
//                 ) : (
//                   <p className="text-xs text-slate-500">출처 정보가 없습니다.</p>
//                 )}
//               </div>
//               ) : (
//                 /* 이미지 탭 */
//                 <div>
//                   {activeImages.length > 0 ? (
//                     <div className="grid grid-cols-2 gap-2">
//                       {activeImages.map((imageUrl, idx) => {
//                         const isFailed = failedImages.has(imageUrl)
//                         return (
//                           <div
//                             key={idx}
//                             onClick={() => !isFailed && handleImageClick(imageUrl)}
//                             className={`aspect-square bg-slate-200 rounded border border-slate-300 overflow-hidden group relative ${
//                               isFailed ? "" : "cursor-pointer hover:opacity-80 transition-opacity"
//                             }`}
//                           >
//                             {isFailed ? (
//                               <div className="w-full h-full flex items-center justify-center">
//                                 <span className="text-xs text-slate-500">이미지</span>
//                               </div>
//                             ) : (
//                               <img
//                                 src={imageUrl}
//                                 alt={`Image ${idx + 1}`}
//                                 className="w-full h-full object-cover"
//                                 onError={() => {
//                                   setFailedImages((prev) => new Set(prev).add(imageUrl))
//                                 }}
//                               />
//                             )}
//                           </div>
//                         )
//                       })}
//                     </div>
//                   ) : (
//                     <p className="text-xs text-slate-500">이미지가 없습니다.</p>
//                   )}
//                 </div>
//               )}

//             </div>
//           </aside>
//         )}
//       </div>

//       {/* 이미지 전체 화면 보기 팝업 */}
//       {selectedImageIndex !== null && (activeTab === "images" ? allImages.length > 0 : activeImages.length > 0) && (
//         <ImageViewer
//           images={activeTab === "images" ? allImages.map(img => img.imageUrl) : activeImages}
//           currentIndex={selectedImageIndex}
//           onClose={handleCloseImageViewer}
//           onPrevious={handlePreviousImage}
//           onNext={handleNextImage}
//         />
//       )}
//       </div>
//     </TooltipProvider>
//   )
// }
