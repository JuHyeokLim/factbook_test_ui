"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Plus, FileText, Link as LinkIcon, Type, Trash2, Upload, Users, HelpCircle, FileSpreadsheet, FilePieChart, File, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { RfpUploadStep } from "./rfp-upload-step"
import { CompanySearchInput } from "../company-search-input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface UnifiedInfoStepProps {
  method: "upload" | "manual"
  setMethod: (method: "upload" | "manual") => void
  formData: any
  setFormData: (data: any) => void
  onRfpProcessing?: (processing: boolean) => void
}

const CATEGORY_OPTIONS = [
  { value: "기초재", label: "기초재", description: "석유, 철강, 화학 원료" },
  { value: "식품", label: "식품", description: "식품 제조, 가공식품" },
  { value: "음료및기호식품", label: "음료 및 기호식품", description: "음료, 주류, 담배" },
  { value: "제약및의료", label: "제약 및 의료", description: "의약품, 의료기기, 병원" },
  { value: "화장품및보건용품", label: "화장품 및 보건용품", description: "화장품, 보건위생용품" },
  { value: "출판", label: "출판", description: "서적, 잡지, 신문" },
  { value: "패션", label: "패션", description: "의류, 신발, 가방, 액세서리" },
  { value: "산업기기", label: "산업기기", description: "산업용 기계, 공구" },
  { value: "정밀기기및사무기기", label: "정밀기기 및 사무기기", description: "계측기, 사무기기" },
  { value: "가정용전기전자", label: "가정용 전기전자", description: "TV, 냉장고, 세탁기" },
  { value: "컴퓨터및정보통신", label: "컴퓨터 및 정보통신", description: "컴퓨터, 스마트폰, 통신" },
  { value: "수송기기", label: "수송기기", description: "자동차, 이륜차" },
  { value: "가정용품", label: "가정용품", description: "가구, 주방용품, 생활용품" },
  { value: "화학공업", label: "화학공업", description: "화학제품, 플라스틱" },
  { value: "건설건재및부동산", label: "건설, 건재 및 부동산", description: "건설, 건축자재, 부동산" },
  { value: "유통", label: "유통", description: "백화점, 마트, 편의점, 이커머스" },
  { value: "금융보험및증권", label: "금융, 보험 및 증권", description: "은행, 보험, 증권, 핀테크" },
  { value: "서비스", label: "서비스", description: "IT서비스, 플랫폼, 소프트웨어" },
  { value: "관공서및단체", label: "관공서 및 단체", description: "정부기관, 공공기관" },
  { value: "교육", label: "교육", description: "교육기관, 교육서비스" },
  { value: "그룹광고", label: "그룹광고", description: "그룹 CI, 통합 광고" },
  { value: "기타", label: "기타", description: "기타 업종" },
]

export function UnifiedInfoStep({ method, setMethod, formData, setFormData, onRfpProcessing }: UnifiedInfoStepProps) {
  const { toast } = useToast()
  const [referenceTab, setReferenceTab] = useState<"file" | "link" | "text">("file")
  const [linkInput, setLinkInput] = useState("")
  const [textInput, setTextInput] = useState("")
  const [uploadedRfp, setUploadedRfp] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const isUploadingRef = uploadingCount > 0
  
  // 개별 항목 입력을 위한 로컬 상태 (competitor, proposal, target 입력 버퍼)
  const [inputs, setInputs] = useState<Record<string, { competitor: string, proposal: string, target: string }>>({})

  const handleInputChange = (id: string, field: 'competitor' | 'proposal' | 'target', value: string) => {
    setInputs(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { competitor: '', proposal: '', target: '' }), [field]: value }
    }))
  }

  // 제품/서비스 항목 handlers
  const handleAddItem = () => {
    if (formData.items.length < 5) {
      setFormData((prev: any) => ({
        ...prev,
        items: [
          ...prev.items,
          { id: Date.now().toString(), productName: "", competitors: [], proposals: [], targetCustomers: [] }
        ],
      }))
    }
  }

  const handleRemoveItem = (id: string) => {
    setFormData((prev: any) => {
      if (prev.items.length <= 1) return prev
      return {
        ...prev,
        items: prev.items.filter((item: any) => item.id !== id),
      }
    })
  }

  const handleUpdateItemName = (id: string, name: string) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => 
        item.id === id ? { ...item, productName: name } : item
      )
    }))
  }

  // 내부 리스트 handlers (competitors, proposals, targetCustomers)
  const handleAddSubItem = (id: string, field: 'competitors' | 'proposals' | 'targetCustomers', value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => {
        if (item.id === id) {
          if (item[field].length >= 5) return item
          if (item[field].includes(trimmed)) return item
          return { ...item, [field]: [...item[field], trimmed] }
        }
        return item
      })
    }))

    // 입력 필드 초기화
    const inputKey = field === 'competitors' ? 'competitor' : field === 'proposals' ? 'proposal' : 'target'
    handleInputChange(id, inputKey as any, "")
  }

  const handleRemoveSubItem = (itemId: string, field: 'competitors' | 'proposals' | 'targetCustomers', idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.map((item: any) => 
        item.id === itemId 
          ? { ...item, [field]: item[field].filter((_: any, i: number) => i !== idx) }
          : item
      )
    }))
  }

  // 엔터 입력 처리
  const handleKeyDown = (e: React.KeyboardEvent, itemId: string, field: 'competitors' | 'proposals' | 'targetCustomers') => {
    if (e.key === "Enter") {
      // 한국어 IME 입력 중 엔터 중복 방지
      if (e.nativeEvent.isComposing) return
      
      e.preventDefault()
      const inputKey = (field === 'competitors' ? 'competitor' : field === 'proposals' ? 'proposal' : 'target') as keyof { competitor: string, proposal: string, target: string }
      const value = inputs[itemId]?.[inputKey] || ""
      handleAddSubItem(itemId, field, value)
    }
  }

  // 참고 자료 handlers
  const handleAddReference = async (type: "file" | "link" | "text", value: any) => {
    if (formData.referenceMaterials.length >= 10) return

    setUploadingCount(prev => prev + 1)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

    try {
      let newMaterial = null

      if (type === "link") {
        let url = value.url.trim()
        
        // 1. 프로토콜(http/https)이 없으면 자동으로 https:// 추가
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`
        }

        // 2. 간단한 URL 유효성 체크 (도메인 형식이 맞는지)
        const urlPattern = /^https?:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+/i
        if (!urlPattern.test(url)) {
          toast({
            title: "유효하지 않은 주소",
            description: "정확한 웹사이트 주소를 입력해주세요.",
            variant: "destructive"
          })
          setUploadingCount(prev => Math.max(0, prev - 1))
          return
        }

        const response = await fetch(`${backendUrl}/api/upload/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.detail || "Link processing failed")
        }
        const result = await response.json()

        if (result.success) {
          newMaterial = {
            id: Date.now().toString(),
            type: "link" as const,
            name: result.name,
            url: result.url,
            s3_key: result.s3_key,
            content: result.content,
            file_size: result.file_size,
            content_type: result.content_type
          }
        }
      } else if (type === "text") {
        const response = await fetch(`${backendUrl}/api/upload/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: value.content })
        })

        if (!response.ok) throw new Error("Text processing failed")
        const result = await response.json()

        if (result.success) {
          newMaterial = {
            id: Date.now().toString(),
            type: "text" as const,
            name: result.name,
            s3_key: result.s3_key,
            content: result.content,
            file_size: result.file_size,
            content_type: result.content_type
          }
        }
      }

      if (newMaterial) {
        setFormData((prev: any) => ({
          ...prev,
          referenceMaterials: [...prev.referenceMaterials, newMaterial]
        }))
        
        if (type === "link") setLinkInput("")
        if (type === "text") setTextInput("")
        
        toast({
          title: "등록 완료",
          description: `${type === "link" ? "링크" : "텍스트"}가 정상적으로 등록되었습니다.`
        })
      }
    } catch (error) {
      console.error(`${type} processing error:`, error)
      toast({
        title: "등록 실패",
        description: `${type === "link" ? "링크" : "텍스트"} 처리 중 오류가 발생했습니다.`,
        variant: "destructive"
      })
    } finally {
      setUploadingCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleRemoveReference = async (id: string) => {
    // 이전 상태에서 material 찾기
    const material = formData.referenceMaterials.find((m: any) => m.id === id)
    
    // S3 파일인 경우 삭제 API 호출
    if (material?.s3_key) {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        const response = await fetch(`${backendUrl}/api/upload/reference?s3_key=${encodeURIComponent(material.s3_key)}`, {
          method: 'DELETE'
        })
        if (!response.ok) {
          console.error("Failed to delete S3 file")
        }
      } catch (error) {
        console.error("Error deleting S3 file:", error)
      }
    }

    setFormData((prev: any) => ({
      ...prev,
      referenceMaterials: prev.referenceMaterials.filter((m: any) => m.id !== id)
    }))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 10 - formData.referenceMaterials.length
    const selectedFiles = Array.from(files).slice(0, remainingSlots)
    
    if (selectedFiles.length === 0) {
      toast({
        title: "한도 초과",
        description: "참고 자료는 최대 10개까지 등록 가능합니다.",
        variant: "destructive"
      })
      return
    }

    setUploadingCount(prev => prev + selectedFiles.length)
    
    for (const file of selectedFiles) {
      try {
        const uploadFormData = new FormData()
        uploadFormData.append("file", file)

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        const response = await fetch(`${backendUrl}/api/upload/reference`, {
          method: "POST",
          body: uploadFormData
        })

        if (!response.ok) throw new Error("Upload failed")

        const result = await response.json()
        
        if (result.success) {
            const newMaterial = {
              id: Date.now().toString() + Math.random(),
              type: "file" as const,
              name: result.filename,
              url: result.url,
              s3_key: result.s3_key,
              file_size: result.file_size,
              content_type: result.content_type,
              content: result.extracted_text
            }

          setFormData((prev: any) => ({
            ...prev,
            referenceMaterials: [...prev.referenceMaterials, newMaterial]
          }))
        }
      } catch (error) {
        console.error("File upload error:", error)
        toast({
          title: "업로드 실패",
          description: `${file.name} 업로드 중 오류가 발생했습니다.`,
          variant: "destructive"
        })
      } finally {
        setUploadingCount(prev => Math.max(0, prev - 1))
      }
    }
    
    // input 초기화
    e.target.value = ""
  }

  return (
    <div className="flex gap-8">
      {/* 왼쪽: RFP 및 참고 자료 영역 */}
      <div className="w-[450px] flex flex-col gap-6 flex-shrink-0">
        {/* 모드 선택 및 RFP 등록 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 flex-shrink-0">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => !isUploading && setMethod("upload")}
              disabled={isUploading}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                method === "upload" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              } ${isUploading ? "cursor-not-allowed" : ""}`}
            >
              RFP 등록
            </button>
            <button
              onClick={() => !isUploading && setMethod("manual")}
              disabled={isUploading}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                method === "manual" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
              } ${isUploading ? "cursor-not-allowed" : ""}`}
            >
              직접 입력
            </button>
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {/* 1. RFP 업로드 대기 상태 (RFP 등록 탭 + 파일 없음) */}
            {method === "upload" && !uploadedRfp && (
              <RfpUploadStep
                onUploadStatusChange={(loading) => {
                  setIsUploading(loading)
                  onRfpProcessing?.(loading)
                }}
                onExtractedData={(data) => {
                  if (data) {
                    // items 구조 변경 대응
                    const mappedItems = (data.items || []).map((item: any) => ({
                      id: item.id || Date.now().toString() + Math.random(),
                      productName: item.product_name || "",
                      competitors: item.competitors || [],
                      proposals: item.proposals || [],
                      targetCustomers: item.target_customers || []
                    }))

                    // RFP 파일 상태 저장
                    setUploadedRfp({
                      name: data._fileName || "RFP 문서",
                      type: "file"
                    })

                    setFormData((prev: any) => ({
                      ...prev,
                      companyName: data.company_name || prev.companyName,
                      category: data.category || prev.category,
                      // 사용자가 이미 입력한 데이터가 있다면, 분석 결과가 비어있지 않을 때만 덮어씀
                      items: mappedItems.length > 0 ? mappedItems : prev.items,
                      menuItems: data.menu_recommendations 
                        ? { ...prev.menuItems, ...data.menu_recommendations }
                        : prev.menuItems,
                      analysisItems: {
                        ...prev.analysisItems,
                        media: data.requires_media_analysis ?? prev.analysisItems?.media ?? false,
                      },
                    }))
                    setMethod("manual")
                  }
                }}
              />
            )}

            {/* 2. RFP 분석 완료 상태 (파일 있음) */}
            {uploadedRfp && (
              <div className="space-y-4">
                <div className="group relative flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 truncate">
                      {uploadedRfp.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate uppercase italic">PDF</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full flex-shrink-0"
                    onClick={() => setUploadedRfp(null)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* 3. 직접 입력 안내 상태 (직접 입력 탭 + 파일 없음) */}
            {method === "manual" && !uploadedRfp && (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center space-y-1">
                <p className="text-[13px] text-slate-600 font-semibold leading-relaxed">
                  오른쪽 패널에서 상세 정보를 입력하실 수 있습니다.
                </p>
                <p className="text-[11px] text-slate-400 font-medium italic">
                  기업명과 제품/서비스명은 필수 항목입니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 참고 자료 등록 섹션 */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5 flex-shrink-0 ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-slate-900">참고 자료</h3>
            <span className="text-[11px] text-slate-400 font-bold">{formData.referenceMaterials.length}/10</span>
          </div>

          <Tabs value={referenceTab} onValueChange={(v: any) => setReferenceTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9 bg-slate-100/80 p-1 rounded-xl">
              <TabsTrigger value="file" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">파일</TabsTrigger>
              <TabsTrigger value="link" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">링크</TabsTrigger>
              <TabsTrigger value="text" className="text-[11px] font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">텍스트</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="file">
                <div className={cn(
                  "relative group cursor-pointer",
                  isUploadingRef && "opacity-50 pointer-events-none"
                )}>
                  <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 transition-all group-hover:bg-slate-50 group-hover:border-primary/30">
                    {isUploadingRef ? (
                      <Loader2 className="w-6 h-6 text-primary mb-2 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 text-slate-400 mb-2 group-hover:text-primary transition-colors" />
                    )}
                    <p className="text-xs font-semibold text-slate-600 group-hover:text-primary transition-colors">
                      {isUploadingRef ? "업로드 중..." : "파일을 선택하세요"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">최대 10MB (PDF, DOCX, PPTX, XLSX)</p>
                  </div>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileSelect}
                    multiple
                    accept=".pdf,.docx,.pptx,.xlsx,.txt"
                    disabled={formData.referenceMaterials.length >= 10 || isUploadingRef}
                  />
                </div>
              </TabsContent>

              <TabsContent value="link" className="space-y-2">
                <Input
                  placeholder="https://example.com"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  disabled={formData.referenceMaterials.length >= 10 || isUploadingRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      if (linkInput && !isUploadingRef) handleAddReference("link", { url: linkInput })
                    }
                  }}
                  className="h-9 text-xs shadow-sm focus:ring-1 rounded-xl border-slate-200"
                />
                <Button
                  variant="default"
                  className="w-full h-9 rounded-xl shadow-sm text-xs font-bold"
                  onClick={() => linkInput && handleAddReference("link", { url: linkInput })}
                  disabled={formData.referenceMaterials.length >= 10 || !linkInput || isUploadingRef}
                >
                  {isUploadingRef && referenceTab === "link" ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : null}
                  링크 추가
                </Button>
              </TabsContent>

              <TabsContent value="text" className="space-y-2">
                <Textarea
                  placeholder="참고할 텍스트 내용을 입력하세요."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={formData.referenceMaterials.length >= 10 || isUploadingRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault()
                      if (textInput && !isUploadingRef) handleAddReference("text", { content: textInput })
                    }
                  }}
                  className="min-h-[100px] text-xs resize-none shadow-sm focus:ring-1 rounded-xl border-slate-200 p-3"
                />
                <Button
                  variant="default"
                  className="w-full h-9 rounded-xl shadow-sm text-xs font-bold"
                  onClick={() => textInput && handleAddReference("text", { content: textInput })}
                  disabled={formData.referenceMaterials.length >= 10 || !textInput || isUploadingRef}
                >
                  {isUploadingRef && referenceTab === "text" ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : null}
                  텍스트 추가
                </Button>
              </TabsContent>
            </div>
          </Tabs>

          {/* 등록된 자료 목록 */}
          <div className="space-y-3">
            {formData.referenceMaterials.map((material: any) => {
              // 파일 확장자별 아이콘 및 유형 결정
              const getFileInfo = (m: any) => {
                if (m.type === "link") return { 
                  icon: <LinkIcon className="w-6 h-6 text-slate-600" />, 
                  typeLabel: m.url,
                  title: m.name || "연결된 링크",
                  colorClass: "text-slate-900",
                  subColorClass: "text-slate-500"
                }
                if (m.type === "text") return { 
                  icon: <Type className="w-6 h-6 text-slate-600" />, 
                  typeLabel: "Text",
                  title: m.content?.slice(0, 30) + (m.content?.length > 30 ? "..." : ""),
                  colorClass: "text-slate-900",
                  subColorClass: "text-slate-500"
                }
                
                const ext = m.name?.split('.').pop()?.toLowerCase()
                if (ext === 'pdf') return { icon: <FileText className="w-6 h-6 text-red-500" />, typeLabel: "PDF", colorClass: "text-slate-900", subColorClass: "text-slate-500" }
                if (['doc', 'docx'].includes(ext)) return { icon: <FileText className="w-6 h-6 text-blue-500" />, typeLabel: "Word", colorClass: "text-slate-900", subColorClass: "text-slate-500" }
                if (['ppt', 'pptx'].includes(ext)) return { icon: <FilePieChart className="w-6 h-6 text-orange-500" />, typeLabel: "PPT", colorClass: "text-slate-900", subColorClass: "text-slate-500" }
                if (['xls', 'xlsx'].includes(ext)) return { icon: <FileSpreadsheet className="w-6 h-6 text-emerald-500" />, typeLabel: "Excel", colorClass: "text-slate-900", subColorClass: "text-slate-500" }
                return { icon: <File className="w-6 h-6 text-slate-400" />, typeLabel: "기타", colorClass: "text-slate-900", subColorClass: "text-slate-500" }
              }

              const info = getFileInfo(material)
              const displayTitle = info.title || material.name

              return (
                <div key={material.id} className="group relative flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-all">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded flex items-center justify-center flex-shrink-0">
                    {info.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[13px] font-medium truncate", info.colorClass)}>
                      {displayTitle}
                    </p>
                    <p className={cn("text-[10px] font-medium truncate italic", info.subColorClass)}>{info.typeLabel}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full flex-shrink-0"
                    onClick={() => handleRemoveReference(material.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 오른쪽: 직접 입력 영역 */}
      <div className={`flex-1 border rounded-2xl transition-all duration-300 relative bg-white border-slate-100 ${
        (method === "manual" || uploadedRfp) ? "shadow-sm" : "cursor-not-allowed"
      } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
        {(method === "manual" || uploadedRfp) ? (
          <div className="p-8 space-y-8">
            {/* 기업 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <div className="flex items-center gap-2">
                  <label className="text-[18px] font-bold text-slate-900">기업명 <span className="text-red-600">*</span></label>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground font-medium cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <div className="space-y-2">
                          <p className="font-semibold">DART 등록 기업 검색</p>
                          <p className="text-sm">
                            입력하시면 DART에 등록된 기업명 후보가 표시됩니다.
                          </p>
                          <div className="border-t pt-2 space-y-1 text-xs">
                            <p>• <span className="font-medium">DART 등록 기업:</span> 재무제표 등 공식 데이터 제공</p>
                            <p>• <span className="font-medium">미등록 기업:</span> 일반 검색 데이터 사용 (입력 가능)</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <CompanySearchInput
                    value={formData.companyName}
                    onChange={(value) => setFormData((prev: any) => ({ ...prev, companyName: value }))}
                    placeholder="기업명을 입력하세요."
                    showLabel={false}
                  />
                </div>

                <div className="space-y-2"> {/* pt-[26px] 제거: 라벨이 없어졌으므로 */}
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev: any) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-10 rounded-xl text-sm border-slate-200">
                      <SelectValue placeholder="업종 카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px] rounded-xl border-slate-100 shadow-xl">
                      <div className="p-2 grid grid-cols-1 gap-1">
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="rounded-lg py-2.5 focus:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[13px] font-semibold text-slate-900 leading-none">
                                {option.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium leading-tight">
                                {option.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 제품/서비스 리스트 섹션 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  <label className="text-[18px] font-bold text-slate-900">제품/서비스</label>
                </div>
              </div>

              <div className="space-y-4">
                {formData.items.map((item: any, idx: number) => (
                  <div key={item.id} className="group/card">
                    <div className="border border-slate-100 rounded-2xl p-6 bg-slate-50 space-y-2">
                      {/* 제품/서비스 번호 및 삭제 버튼 */}
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100/50">
                        <span className="text-[14px] font-bold text-slate-800">제품/서비스 {idx + 1}</span>
                        {formData.items.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveItem(item.id)} 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-full"
                          >
                            <Trash2 className="w-4 h-4 transition-colors" />
                          </Button>
                        )}
                      </div>

                      {/* 제품명 입력 */}
                      <div className="space-y-2">
                        <Input
                          placeholder="제품/서비스명을 입력하세요."
                          value={item.productName}
                          onChange={(e) => handleUpdateItemName(item.id, e.target.value)}
                          className="h-11 shadow-sm focus:ring-1 bg-white border-slate-200 rounded-xl"
                        />
                      </div>

                      {/* 하위 항목들 (경쟁사, 요구사항, 타겟) */}
                      <div className="mt-4 space-y-3 pl-4 border-l-2 border-slate-100/50">
                        {/* 경쟁사 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-500">
                            <div className="w-3 h-3 border-l-2 border-b-2 border-slate-200 rounded-bl-[4px]" />
                            <span className="text-[13px] font-bold">경쟁사</span>
                          </div>
                          <div className="space-y-3">
                            <Input
                              placeholder="경쟁사를 입력하세요 (Enter)"
                              value={inputs[item.id]?.competitor || ""}
                              onChange={(e) => handleInputChange(item.id, 'competitor', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, item.id, 'competitors')}
                              className="h-10 text-sm shadow-sm focus:ring-1 bg-white rounded-xl"
                            />
                            {item.competitors.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.competitors.map((c: string, cIdx: number) => (
                                  <Badge key={cIdx} variant="secondary" className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 group/badge">
                                    {c}
                                    <button 
                                      onClick={() => handleRemoveSubItem(item.id, 'competitors', cIdx)} 
                                      className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 요구사항 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-500">
                            <div className="w-3 h-3 border-l-2 border-b-2 border-slate-200 rounded-bl-[4px]" />
                            <span className="text-[13px] font-bold">요구사항</span>
                          </div>
                          <div className="space-y-3">
                            <Input
                              placeholder="요구 사항을 입력하세요 (Enter)"
                              value={inputs[item.id]?.proposal || ""}
                              onChange={(e) => handleInputChange(item.id, 'proposal', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, item.id, 'proposals')}
                              className="h-10 text-sm shadow-sm focus:ring-1 bg-white rounded-xl"
                            />
                            {item.proposals.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.proposals.map((p: string, pIdx: number) => (
                                  <Badge key={pIdx} variant="secondary" className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 group/badge">
                                    {p}
                                    <button 
                                      onClick={() => handleRemoveSubItem(item.id, 'proposals', pIdx)} 
                                      className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 타겟 고객 */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-slate-500">
                            <div className="w-3 h-3 border-l-2 border-b-2 border-slate-200 rounded-bl-[4px]" />
                            <span className="text-[13px] font-bold">타겟 고객</span>
                          </div>
                          <div className="space-y-3">
                            <Input
                              placeholder="타겟 고객을 입력하세요 (Enter)"
                              value={inputs[item.id]?.target || ""}
                              onChange={(e) => handleInputChange(item.id, 'target', e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, item.id, 'targetCustomers')}
                              className="h-10 text-sm shadow-sm focus:ring-1 bg-white rounded-xl"
                            />
                            {item.targetCustomers.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.targetCustomers.map((t: string, tIdx: number) => (
                                  <Badge key={tIdx} variant="secondary" className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 group/badge">
                                    {t}
                                    <button 
                                      onClick={() => handleRemoveSubItem(item.id, 'targetCustomers', tIdx)} 
                                      className="text-slate-300 hover:text-red-600 hover:bg-red-50 rounded p-0.5 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 제품/서비스 추가 버튼 */}
                <Button 
                  variant="outline" 
                  className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 rounded-2xl font-bold transition-all"
                  onClick={handleAddItem}
                  disabled={formData.items.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  제품/서비스 추가
                </Button>
                {formData.items.length >= 5 && (
                  <p className="text-center text-[11px] text-slate-400 mt-2 italic">
                    최대 5개까지 추가 가능합니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // 비활성화 상태
          <div className="h-full flex flex-col items-center justify-center p-10 select-none">
            <div className="text-center space-y-2 opacity-40">
              <p className="text-xl font-bold text-slate-900">상세 정보 입력</p>
              <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                먼저 왼쪽에서 RFP를 등록하시거나<br />
                직접 입력 버튼을 눌러 패널을 활성화해주세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

