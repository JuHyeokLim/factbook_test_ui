"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface RfpUploadStepProps {
  onFileSelect?: (file: File) => void
  onExtractedData?: (data: any) => void
}

export function RfpUploadStep({ onFileSelect, onExtractedData }: RfpUploadStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
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
          description: "10MB 이하의 pdf, pptx, docx, hwp 파일만 업로드 가능합니다.",
          variant: "destructive",
        })
      }
    }
  }

  const isValidFile = (file: File): boolean => {
    const validExtensions = [".pdf", ".pptx", ".docx", ".hwp"]
    const hasValidExtension = validExtensions.some((ext) => file.name.endsWith(ext))
    return hasValidExtension && file.size <= 10 * 1024 * 1024
  }

  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile)
    onFileSelect?.(selectedFile)

    // 자동 업로드 시작
    setUploading(true)
    setUploadProgress(30)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      setUploadProgress(60)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("업로드 실패")
      }

      const data = await response.json()
      setUploadProgress(100)

      // 추출된 데이터 전달
      onExtractedData?.(data)

      toast({
        title: "파일 업로드 완료",
        description: "RFP에서 정보를 추출했습니다.",
      })

      // 자동으로 다음 단계로 이동
      setTimeout(() => {
        setUploading(false)
      }, 1000)
    } catch (error) {
      console.error("Upload error:", error)
      setUploading(false)
      setUploadProgress(0)
      toast({
        title: "업로드 실패",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
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
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <div>
              <p className="font-medium">파일 업로드 중...</p>
              <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </div>
        ) : file ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <span className="font-medium">{file.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)}MB</div>
            <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="gap-1">
              <X className="w-4 h-4" />
              삭제
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">RFP를 여기에 끌어다놓으세요</p>
              <p className="text-sm text-muted-foreground">또는 파일을 선택하세요 (10MB 이하의 pdf, pptx, docx, hwp)</p>
            </div>
            <label>
              <Button variant="outline" asChild>
                <span>파일 선택</span>
              </Button>
              <input type="file" hidden accept=".pdf,.pptx,.docx,.hwp" onChange={handleFileInput} />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
