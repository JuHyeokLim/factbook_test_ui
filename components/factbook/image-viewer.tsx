"use client"

import { useEffect, useState, useRef } from "react"
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

function getDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace("www.", "")
  } catch {
    return null
  }
}

interface ImageViewerProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  /** 이미지별 출처 URL (순서는 images와 동일). 있으면 "출처 링크로 이동" 버튼 표시 */
  sourceUrls?: (string | undefined)[]
}

export function ImageViewer({ images, currentIndex, onClose, onPrevious, onNext, sourceUrls }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  const MIN_ZOOM = 0.1
  const MAX_ZOOM = 5
  const ZOOM_STEP = 0.1

  // 이미지가 변경되면 줌과 위치 리셋
  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex])

  // 줌 인
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM))
  }

  // 줌 아웃
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM))
  }

  // 줌 리셋
  const handleResetZoom = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  // 마우스 휠로 줌
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom((prev) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta))
      return newZoom
    })
  }

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  // 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 더블클릭으로 줌 리셋
  const handleDoubleClick = () => {
    handleResetZoom()
  }

  // 이미지 다운로드
  const handleDownload = async () => {
    try {
      const imageUrl = images[currentIndex]
      
      // CORS 문제를 방지하기 위해 fetch 대신 a 태그를 사용하여 새 탭에서 열거나 
      // 가능한 경우 다운로드를 시도합니다.
      try {
        const response = await fetch(imageUrl, { mode: 'cors' })
        if (!response.ok) throw new Error('Network response was not ok')
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        
        // 파일명 추출 (URL에서)
        const urlParts = imageUrl.split("/")
        let fileName = urlParts[urlParts.length - 1]?.split("?")[0] || `image-${currentIndex + 1}.jpg`
        if (!fileName.includes(".")) fileName += ".jpg"
        
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (e) {
        // CORS 에러가 발생할 경우 새 탭에서 이미지를 엽니다.
        const link = document.createElement("a")
        link.href = imageUrl
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        // 일부 브라우저에서는 외부 도메인이더라도 download 속성이 작동할 수 있습니다.
        link.download = `image-${currentIndex + 1}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error("이미지 다운로드 실패:", error)
      window.open(images[currentIndex], "_blank")
    }
  }

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrevious) {
        e.preventDefault()
        onPrevious()
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault()
        onNext()
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault()
        handleZoomIn()
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault()
        handleZoomOut()
      } else if (e.key === "0") {
        e.preventDefault()
        handleResetZoom()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [hasPrevious, hasNext, onPrevious, onNext, onClose])

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 닫기 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* 다운로드 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className="absolute top-4 right-16 text-white hover:bg-white/20 z-10"
        title="다운로드 (D)"
      >
        <Download className="w-6 h-6" />
      </Button>

      {/* 출처 링크 (닫기/다운로드와 동일 높이·여백·호버 스타일, 아이콘 + 링크) */}
      {sourceUrls?.[currentIndex] && (() => {
        const sourceUrl = sourceUrls[currentIndex]!
        const domain = getDomainFromUrl(sourceUrl)
        const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null
        const displayText = domain || sourceUrl
        return (
          <button
            type="button"
            onClick={() => window.open(sourceUrl, "_blank", "noopener,noreferrer")}
            className="absolute top-4 right-28 z-10 flex h-9 items-center gap-1.5 rounded-md px-3 text-white hover:bg-white/20 transition-colors max-w-[180px]"
            title={sourceUrl}
          >
            {faviconUrl ? (
              <img src={faviconUrl} alt="" className="size-4 flex-shrink-0 rounded-sm" onError={(e) => { e.currentTarget.style.display = "none" }} />
            ) : null}
            <span className="text-[11px] truncate">{displayText}</span>
          </button>
        )
      })()}

      {/* 줌 컨트롤 버튼들 */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="text-white hover:bg-white/20"
          title="줌 아웃 (-)"
          disabled={zoom <= MIN_ZOOM}
        >
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleResetZoom}
          className="text-white hover:bg-white/20"
          title="줌 리셋 (0)"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="text-white hover:bg-white/20"
          title="줌 인 (+)"
          disabled={zoom >= MAX_ZOOM}
        >
          <ZoomIn className="w-5 h-5" />
        </Button>
        <span className="text-white text-sm px-2">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* 이전 버튼 */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="absolute left-4 text-white hover:bg-white/20 z-10"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {/* 이미지 컨테이너 */}
      <div 
        ref={containerRef}
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
      >
        <img
          ref={imageRef}
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />
      </div>

      {/* 다음 버튼 */}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 text-white hover:bg-white/20 z-10"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}

      {/* 이미지 카운터 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
