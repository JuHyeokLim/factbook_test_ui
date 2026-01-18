"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface RfpUploadStepProps {
  onFileSelect?: (file: File) => void
  onExtractedData?: (data: any) => void
  onUploadStatusChange?: (uploading: boolean) => void
}

export function RfpUploadStep({ onFileSelect, onExtractedData, onUploadStatusChange }: RfpUploadStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const handleSetUploading = (val: boolean) => {
    setUploading(val)
    onUploadStatusChange?.(val)
  }
  const [uploadProgress, setUploadProgress] = useState(0)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const selectedFile = files[0]
      if (isValidFile(selectedFile)) {
        handleFileUpload(selectedFile)
      } else {
        toast({
          title: "유효하지 않은 파일입니다.",
          description: "10MB 이하의 pdf, pptx, docx 파일만 업로드 가능합니다.",
          variant: "destructive",
        })
      }
    }
  }

  const isValidFile = (file: File): boolean => {
    const validExtensions = [".pdf", ".pptx", ".docx"]
    const hasValidExtension = validExtensions.some((ext) => file.name.endsWith(ext))
    return hasValidExtension && file.size <= 10 * 1024 * 1024
  }

  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile)
    onFileSelect?.(selectedFile)

    // 자동 업로드 시작
    handleSetUploading(true)
    setUploadProgress(0)

    return new Promise<void>((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const xhr = new XMLHttpRequest()

      // 서버 처리 중 진행률 시뮬레이션 (추가 요청 없이)
      let processingInterval: NodeJS.Timeout | null = null
      let uploadCompleted = false

      // 실제 업로드 진행률 추적
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          // 업로드는 70%까지, 나머지 30%는 서버 처리 시간으로 예상
          setUploadProgress(Math.min(percentComplete * 0.7, 70))
          
          // 업로드 완료 시점 감지 (100% 도달)
          if (e.loaded === e.total && !uploadCompleted) {
            uploadCompleted = true
            // 업로드 완료 후 서버 처리 시작 (70-95% 점진적 증가)
            if (processingInterval) {
              clearInterval(processingInterval)
            }
            
            let currentProgress = 70
            processingInterval = setInterval(() => {
              if (currentProgress < 95) {
                currentProgress += 0.5 // 0.5%씩 증가
                setUploadProgress(currentProgress)
              } else {
                if (processingInterval) {
                  clearInterval(processingInterval)
                  processingInterval = null
                }
              }
            }, 200) // 200ms마다 0.5% 증가
          }
        }
      })

      xhr.addEventListener("load", () => {
        // 서버 처리 완료
        if (processingInterval) {
          clearInterval(processingInterval)
          processingInterval = null
        }
        
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(95)
          
          try {
            const result = JSON.parse(xhr.responseText)

            // 문제 5 해결: 에러가 있어도 부분 데이터는 사용 가능하도록 처리
            const hasError = !!result.error
            if (hasError) {
              console.error("RFP 파싱 에러:", result.error)
            }

            // 백엔드 응답 형식: { success: true, data: {...}, menu_recommendations: {...}, error?: {...} }
            const extractedData = {
              ...(result.data || result),
              menu_recommendations: result.menu_recommendations,
              _hasError: hasError,  // 에러 플래그 추가
              _errorInfo: result.error || null,  // 에러 정보 추가
              _fileName: selectedFile.name, // 파일명 추가
            }
            
            setUploadProgress(100)
            
            // 사용자에게 결과 알림
            if (!hasError) {
              toast({
                title: "파일 업로드 완료",
                description: "RFP에서 정보를 추출했습니다.",
              })
            } else {
              // 에러가 있지만 부분 데이터는 사용 가능
              toast({
                title: "부분 추출 완료",
                description: `일부 정보를 추출했습니다.\n에러: ${result.error.message || "알 수 없는 에러"}\n\n누락된 내용은 직접 입력해 주세요.`,
                variant: "destructive",
              })
            }

            // 100% 표시를 잠시 보여준 후 탭 이동 및 리셋
            setTimeout(() => {
              // 추출된 데이터 전달 (에러가 있어도 부분 데이터 사용)
              // 이 시점에 탭이 '직접 입력'으로 이동됨
              onExtractedData?.(extractedData)
              
              // 탭 이동 후 잠시 더 100%를 보여주고 리셋
              setTimeout(() => {
                handleSetUploading(false)
                setUploadProgress(0)
                resolve()
              }, 800)
            }, 1000)
          } catch (parseError) {
            console.error("Response parse error:", parseError)
            handleSetUploading(false)
            setUploadProgress(0)
            reject(new Error("응답 파싱에 실패했습니다."))
          }
        } else {
          if (processingInterval) {
            clearInterval(processingInterval)
            processingInterval = null
          }
          handleSetUploading(false)
          setUploadProgress(0)
          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.detail || errorData.message || "업로드 실패"))
          } catch {
            reject(new Error(`업로드 실패 (${xhr.status})`))
          }
        }
      })

      xhr.addEventListener("error", () => {
        if (processingInterval) {
          clearInterval(processingInterval)
          processingInterval = null
        }
        handleSetUploading(false)
        setUploadProgress(0)
        reject(new Error("네트워크 오류가 발생했습니다."))
      })

      xhr.addEventListener("abort", () => {
        if (processingInterval) {
          clearInterval(processingInterval)
          processingInterval = null
        }
        handleSetUploading(false)
        setUploadProgress(0)
        reject(new Error("업로드가 취소되었습니다."))
      })

      xhr.open("POST", `${backendUrl}/api/extract-rfp`)
      xhr.send(formData)
    }).catch((error) => {
      console.error("Upload error:", error)
      handleSetUploading(false)
      setUploadProgress(0)
      const errorMessage = error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다."
      toast({
        title: "업로드 실패",
        description: errorMessage,
        variant: "destructive",
      })
    })
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0] && isValidFile(files[0])) {
      handleFileUpload(files[0])
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-muted"
        } ${uploading ? "pointer-events-none" : ""}`}
      >
        {uploading ? (
          <div className="space-y-5 py-2">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <Loader2 className="relative w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <p className="text-[13px] font-bold text-slate-800 tracking-tight">
                {uploadProgress < 70 
                  ? "파일을 업로드하고 있습니다" 
                  : uploadProgress < 100 
                  ? "AI가 정보를 추출하고 있습니다" 
                  : "분석이 완료되었습니다"}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">잠시만 기다려 주세요...</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner border border-slate-200/50">
              <div 
                className="h-full bg-primary relative transition-all duration-500 ease-out shadow-[0_0_12px_rgba(var(--primary),0.4)]"
                style={{ width: `${Math.min(uploadProgress, 100)}%` }}
              >
                {/* 움직이는 빛 효과 */}
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-primary animate-pulse">
                {Math.round(Math.min(uploadProgress, 100))}%
              </span>
            </div>
          </div>
        ) : file ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold">{file.name}</span>
            </div>
            <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)}MB</div>
            <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="gap-1">
              <X className="w-4 h-4" />
              삭제
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-semibold">RFP를 여기에 끌어다놓으세요</p>
              <p className="text-[11px] text-muted-foreground">또는 파일을 선택하세요 (10MB 이하의 pdf, pptx, docx)</p>
            </div>
            <label>
              <Button variant="outline" asChild size="sm" className="h-8 text-xs px-4 rounded-lg">
                <span>파일 선택</span>
              </Button>
              <input type="file" hidden accept=".pdf,.pptx,.docx" onChange={handleFileInput} />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
