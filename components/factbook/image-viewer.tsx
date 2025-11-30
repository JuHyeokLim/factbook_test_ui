"use client"

import { useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageViewerProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

export function ImageViewer({ images, currentIndex, onClose, onPrevious, onNext }: ImageViewerProps) {
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < images.length - 1

  // 키보드 이벤트 핸들러 (방향키로 이미지 네비게이션)
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
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [hasPrevious, hasNext, onPrevious, onNext, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* 닫기 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
      >
        <X className="w-6 h-6" />
      </Button>

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

      {/* 이미지 */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className="max-w-full max-h-full object-contain"
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
