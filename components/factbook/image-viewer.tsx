"use client"

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

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* 닫기 버튼 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white/20"
      >
        <X className="w-6 h-6" />
      </Button>

      {/* 이전 버튼 */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="absolute left-4 text-white hover:bg-white/20"
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}

      {/* 이미지 */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* 다음 버튼 */}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 text-white hover:bg-white/20"
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}
    </div>
  )
}
