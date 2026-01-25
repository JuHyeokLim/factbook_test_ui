"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Loader2, ExternalLink, PlayCircle, Image as ImageIcon, FileText,
  Facebook, Instagram, Youtube, Search, MousePointer2, 
  Calendar, Clock, Globe, MessageSquare, Send, ChevronDown, Building2,
  ChevronLeft, ChevronRight, X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MediaTabProps {
  factbookId: string
}

interface MetaCard {
  resized_image_url?: string;
  video_preview_image_url?: string;
  link_url?: string;
  cta_text?: string;
  body?: string;
  caption?: string;
}

interface MediaItem {
  id: number
  platform: string
  brand_name: string
  external_id: string
  advertiser_id: string
  advertiser_name: string
  format: string
  thumbnail_url?: string
  landing_url?: string
  body_text?: string
  cta_text?: string
  start_date?: string
  end_date?: string
  total_days_shown: number
  performance?: any
  media_urls?: string[]
  script_url?: string
  // 추가된 풍부한 정보
  caption?: string
  publisher_platforms?: string[]
  page_categories?: string[]
  page_profile_picture_url?: string
  google_region?: string
  cards?: MetaCard[]
}

interface MediaStats {
  google: number
  meta: number
  facebook: number
  instagram: number
  messenger: number
  threads: number
}

// Meta 카드 슬라이더 모달 컴포넌트
function MetaCarouselModal({ 
  item, 
  isOpen, 
  onClose 
}: { 
  item: MediaItem, 
  isOpen: boolean, 
  onClose: () => void 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cards = item.cards || [];
  
  // 카드가 없는 경우(일반 이미지/비디오 광고)를 위한 가상 카드 생성
  const displayCards = cards.length > 0 ? cards : [{
    resized_image_url: item.thumbnail_url,
    video_preview_image_url: item.thumbnail_url,
    link_url: item.landing_url,
    cta_text: item.cta_text,
    body: item.body_text,
    caption: item.caption
  }];

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % displayCards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + displayCards.length) % displayCards.length);
  };

  const currentCard = displayCards[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>광고 상세 보기 - {item.advertiser_name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col max-h-[90vh] overflow-y-auto">
          {/* 상단: 이미지/비디오 영역 */}
          <div className="w-full aspect-square bg-slate-100 relative group flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                src={currentCard.resized_image_url || currentCard.video_preview_image_url}
                alt={`Card ${currentIndex + 1}`}
                className="w-full h-full object-contain"
              />
            </AnimatePresence>

            {/* 슬라이드 네비게이션 */}
            {displayCards.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); prevCard(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg text-slate-800 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextCard(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg text-slate-800 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                
                {/* 인디케이터 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {displayCards.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-purple-600 w-4' : 'bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 하단: 정보 영역 */}
          <div className="flex flex-col bg-white">
            <div className="p-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  {item.page_profile_picture_url && <img src={item.page_profile_picture_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{item.advertiser_name}</div>
                  <div className="text-[10px] text-slate-400">Sponsored</div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* 카드별 본문 또는 전체 본문 */}
              <div className="space-y-2">
                <div className="text-[13px] font-bold text-slate-900 leading-snug">
                  {currentCard.body || item.body_text}
                </div>
                {currentCard.caption && (
                  <div className="text-[11px] text-slate-500 font-medium italic">
                    {currentCard.caption}
                  </div>
                )}
              </div>

              {currentCard.link_url && (
                <div className="pt-4 border-t border-slate-50">
                  <a 
                    href={currentCard.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    {currentCard.cta_text || '더 알아보기'}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 개별 광고 카드 컴포넌트 (Lazy Loading 적용)
function AdCard({ item, isGoogle, isMeta, getHtmlParentId, getFormatIcon }: { 
  item: MediaItem, 
  isGoogle: boolean, 
  isMeta: boolean,
  getHtmlParentId: (url: string) => string,
  getFormatIcon: (format: string) => React.ReactNode
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" as any }
    }
  }

  return (
    <motion.div 
      key={item.id} 
      variants={itemVariants}
      className={`break-inside-avoid mb-6 group bg-white border-2 ${isGoogle ? 'border-blue-100' : 'border-purple-100'} rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-auto`}
    >
      {/* Meta 전용 Header (Instagram 스타일) */}
      {isMeta && (
        <div className="flex items-center gap-2 py-2 px-3 border-b border-purple-50">
          <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
            {item.page_profile_picture_url ? (
              <img src={item.page_profile_picture_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-[10px]">
                {item.advertiser_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-slate-900 truncate">{item.advertiser_name}</div>
            <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
              {item.publisher_platforms?.map(p => p.charAt(0) + p.slice(1).toLowerCase()).join(', ')}
            </div>
          </div>
        </div>
      )}

          {/* 썸네일 영역 */}
          <div className={`${isMeta ? 'aspect-square' : 'aspect-square'} bg-slate-50 relative flex items-center justify-center overflow-hidden`}>
              <>
                {item.platform === 'google' && item.script_url && (item.format === 'image' || item.format === 'video') ? (
                  <iframe
                    srcDoc={`
                      <html>
                        <head>
                          <base href="https://adstransparency.google.com/">
                          <style>
                            /* 1. 기본 레이아웃: Grid를 사용하여 완벽한 중앙 정렬 */
                            body, html { 
                              margin: 0 !important; 
                              padding: 0 !important; 
                              overflow: hidden !important;
                              width: 100% !important;
                              height: 100% !important;
                              display: grid !important;
                              place-items: center !important;
                              background: transparent !important;
                            }

                            /* 2. 광고 컨테이너: 콘텐츠 크기에 맞게 수축 */
                            #${getHtmlParentId(item.script_url)} { 
                              display: inline-block !important;
                              width: max-content !important;
                              height: auto !important;
                              position: relative !important;
                              transform-origin: center center;
                            }
                          </style>
                        </head>
                        <body>
                          <div id="${getHtmlParentId(item.script_url)}"></div>
                          <script src="${item.script_url}"></script>
                          <script>
                            // MutationObserver를 사용한 정밀한 렌더링 감지
                            const container = document.getElementById('${getHtmlParentId(item.script_url)}');
                            let zoomApplied = false;

                            const applyZoom = () => {
                              if (zoomApplied) return;
                              
                              const actualWidth = container.scrollWidth;
                              const actualHeight = container.scrollHeight;
                              
                              if (actualWidth > 0 && actualHeight > 0) {
                                const parentWidth = window.innerWidth;
                                const parentHeight = window.innerHeight;
                                
                                let zoomRatio;
                                if (actualHeight > actualWidth) {
                                  zoomRatio = (parentHeight / actualHeight) * 0.9;
                                } else {
                                  zoomRatio = (parentWidth / actualWidth) * 0.9;
                                }
                                
                                container.style.zoom = zoomRatio;
                                zoomApplied = true;
                                observer.disconnect();
                              }
                            };

                            const observer = new MutationObserver((mutations) => {
                              applyZoom();
                            });

                            observer.observe(container, { childList: true, subtree: true, attributes: true });
                            
                            // 폴백: 5초 후에도 안되면 강제 시도
                            setTimeout(applyZoom, 5000);
                          </script>
                        </body>
                      </html>
                    `}
                    className="w-full h-full border-none bg-transparent"
                    sandbox="allow-scripts allow-same-origin"
                    title="Google Ad Preview"
                  />
                ) : (isMeta && item.cards && item.cards.length > 1) ? (
                  /* Meta Carousel인 경우 첫 번째 카드 이미지 표시 */
                  <img 
                    src={item.cards[0].resized_image_url || item.cards[0].video_preview_image_url} 
                    alt="Ad Thumbnail" 
                    className="w-full h-full object-cover" 
                  />
                ) : item.thumbnail_url ? (
                  <img 
                    src={item.thumbnail_url} 
                    alt="Ad Thumbnail" 
                    className={`w-full h-full ${isGoogle ? 'object-contain p-4' : 'object-cover'}`} 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    {getFormatIcon(item.format)}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.format}</span>
                  </div>
                )}
              </>
            {item.landing_url && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                {isMeta ? (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsModalOpen(true);
                    }}
                    className="bg-purple-600 text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform hover:bg-purple-700 shadow-xl"
                  >
                    자세히 보기 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <a 
                    href={item.landing_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white text-slate-900 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform hover:bg-slate-50 shadow-xl"
                  >
                    원본 보기 <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 정보 영역 */}
          <div className={`p-4 flex-1 flex flex-col gap-3 ${isGoogle ? 'bg-blue-50/10' : 'bg-white'}`}>
            {isGoogle ? (
              <>
                {/* Google Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white border-none text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
                      <Search className="w-2.5 h-2.5" /> Google
                    </Badge>
                    {item.format.toLowerCase() === 'video' ? (
                      <Badge className="bg-red-600 text-white border-none text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
                        <Youtube className="w-2.5 h-2.5" /> VIDEO
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-800 text-white border-none text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                        {item.format}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <div className="text-[12px] font-bold text-slate-800 truncate">{item.advertiser_name}</div>
                  </div>

                  <div className="pt-2 border-t border-blue-50 space-y-2">
                    {/* 날짜 및 게재일 정보 (Meta와 디자인 통일) */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">게재 기간</span>
                        <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          {item.total_days_shown}일 동안 게재됨
                        </span>
                      </div>
                      {(item.start_date || item.end_date) && (
                        <div className="text-[9px] text-slate-400 text-right font-medium">
                          {item.start_date?.split('T')[0]} ~ {item.end_date?.split('T')[0] || '현재'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Meta Body (Instagram 스타일 캡션) */}
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {item.caption && (
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                          {item.caption}
                        </div>
                      )}
                      {item.cards && item.cards.length > 1 && (
                        <Badge variant="outline" className="text-[9px] border-purple-200 text-purple-600 py-0 h-4 px-1.5">
                          CAROUSEL {item.cards.length}
                        </Badge>
                      )}
                    </div>
                    {item.format.toLowerCase() === 'video' ? (
                      <Badge className="bg-red-600 text-white border-none text-[10px] px-2 py-0.5 font-bold flex items-center gap-1">
                        <Youtube className="w-2.5 h-2.5" /> VIDEO
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-800 text-white border-none text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                        {item.format}
                      </Badge>
                    )}
                  </div>
                  
                  {item.body_text && (
                    <div className="text-[11px] text-slate-700 leading-relaxed line-clamp-4">
                      <span className="font-bold mr-1.5">{item.advertiser_name}</span>
                      <br/>
                      {item.body_text}
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-purple-50 space-y-2">
                    {/* 날짜 및 게재일 정보 */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">게재 기간</span>
                        <span className="text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                          {item.total_days_shown}일 동안 게재됨
                        </span>
                      </div>
                      {(item.start_date || item.end_date) && (
                        <div className="text-[9px] text-slate-400 text-right font-medium">
                          {item.start_date?.split('T')[0]} ~ {item.end_date?.split('T')[0] || '현재'}
                        </div>
                      )}
                    </div>

                    {/* 플랫폼 아이콘 강조 */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">PLATFORMS</span>
                      <div className="flex gap-2">
                        {item.publisher_platforms?.includes('FACEBOOK') && (
                          <div className="bg-blue-50 p-1.5 rounded-lg shadow-sm border border-blue-100">
                            <Facebook className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        {item.publisher_platforms?.includes('INSTAGRAM') && (
                          <div className="bg-pink-50 p-1.5 rounded-lg shadow-sm border border-pink-100">
                            <Instagram className="w-4 h-4 text-pink-600" />
                          </div>
                        )}
                        {item.publisher_platforms?.includes('MESSENGER') && (
                          <div className="bg-sky-50 p-1.5 rounded-lg shadow-sm border border-sky-100">
                            <Send className="w-4 h-4 text-sky-500 rotate-[-20deg]" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* 모달 추가 */}
          {isMeta && (
            <MetaCarouselModal 
              item={item} 
              isOpen={isModalOpen} 
              onClose={() => setIsModalOpen(false)} 
            />
          )}
        </motion.div>
      );
}

export function MediaTab({ factbookId }: MediaTabProps) {
  const [isCollecting, setIsCollecting] = useState(false)
  const [hasCollected, setHasCollected] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [platformStats, setPlatformStats] = useState<MediaStats>({ 
    google: 0, 
    meta: 0,
    facebook: 0,
    instagram: 0,
    messenger: 0,
    threads: 0
  })

  // 통계 계산 함수
  const calculateStats = (ads: MediaItem[]) => {
    const stats = {
      google: 0,
      meta: 0,
      facebook: 0,
      instagram: 0,
      messenger: 0,
      threads: 0
    }

    ads.forEach(ad => {
      if (ad.platform === 'google') {
        stats.google++
      } else if (ad.platform === 'meta') {
        stats.meta++
        // Meta 세부 플랫폼 카운트
        ad.publisher_platforms?.forEach(p => {
          const platform = p.toLowerCase()
          if (platform === 'facebook') stats.facebook++
          if (platform === 'instagram') stats.instagram++
          if (platform === 'messenger') stats.messenger++
          if (platform === 'threads') stats.threads++
        })
      }
    })

    setPlatformStats(stats)
  }

  // mediaItems가 변경될 때마다 통계 재계산
  useEffect(() => {
    calculateStats(mediaItems)
  }, [mediaItems])

  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")
  const [selectedBrand, setSelectedBrand] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  // 고유 브랜드 목록 추출
  const brands = Array.from(new Set(mediaItems.map(ad => ad.brand_name)))

  // 데이터 로드 함수
  const fetchMediaAds = async () => {
    setIsCollecting(true)
    setError(null)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      const response = await fetch(`${backendUrl}/api/factbooks/${factbookId}/media-analysis`)
      const data = await response.json()
      
      if (data.success) {
        setMediaItems(data.ads || [])
        setHasCollected(true)
      } else {
        setError(data.message || "광고 데이터를 가져오는데 실패했습니다.")
      }
    } catch (err) {
      console.error("Media collection error:", err)
      setError("서버와의 통신 중 오류가 발생했습니다.")
    } finally {
      setIsCollecting(false)
    }
  }

  // 초기 로드 시 시도 (이미 수집된 데이터가 있을 수 있음)
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
        const response = await fetch(`${backendUrl}/api/factbooks/${factbookId}/media-analysis`)
        const data = await response.json()
        if (data.success && data.ads && data.ads.length > 0) {
          setMediaItems(data.ads)
      setHasCollected(true)
        }
      } catch (e) {
        console.error("Initial check error:", e)
      }
    }
    checkExisting()
  }, [factbookId])

  const handleStartCollection = () => {
    fetchMediaAds()
  }

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'video': return <PlayCircle className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'carousel': return <ImageIcon className="w-4 h-4" />
      case 'multi_images': return <ImageIcon className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'google':
        return { label: 'Google', color: 'bg-blue-100 text-blue-700' }
      case 'meta':
        return { label: 'Meta', color: 'bg-purple-100 text-purple-700' }
      default:
        return { label: platform, color: 'bg-gray-100 text-gray-700' }
    }
  }

  const getHtmlParentId = (url: string) => {
    const match = url.match(/[?&]htmlParentId=([^&]+)/)
    return match ? match[1] : 'ad-container'
  }

  // 애니메이션 변수 설정
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  // 필터링된 광고 목록
  const filteredAds = mediaItems.filter(ad => {
    // 1. 브랜드 매칭
    const brandMatch = selectedBrand === "all" || ad.brand_name === selectedBrand
    
    // 2. 플랫폼 매칭 (Google 또는 Meta 세부 지면)
    let platformMatch = false
    if (selectedPlatform === "all") {
      platformMatch = true
    } else if (selectedPlatform === "google") {
      platformMatch = ad.platform === "google"
    } else {
      // Meta 세부 플랫폼 필터링 (ad.publisher_platforms 배열 확인)
      const targetPlatform = selectedPlatform.toLowerCase()
      platformMatch = ad.platform === "meta" && 
                      (ad.publisher_platforms?.some(p => p.toLowerCase() === targetPlatform) ?? false)
    }
    
    // 3. 기간 매칭
    let dateMatch = true
    if (dateFilter !== "all" && ad.start_date) {
      const startDate = new Date(ad.start_date)
      const now = new Date()
      const diffDays = (now.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
      if (dateFilter === "30") dateMatch = diffDays <= 30
      if (dateFilter === "90") dateMatch = diffDays <= 90
      if (dateFilter === "180") dateMatch = diffDays <= 180
    }
    
    return brandMatch && platformMatch && dateMatch
  })

  // 수집 전 상태
  if (!hasCollected && !isCollecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">매체 소재 분석</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Google Ads & Meta Ad Library의 데이터를 기반으로<br />
            기업의 실제 광고 집행 현황을 수집합니다.
          </p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleStartCollection} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
            매체 소재 수집 시작하기
          </Button>
        </div>
      </div>
    )
  }

  // 수집 중 상태
  if (isCollecting) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
          <div>
            <p className="text-lg font-bold text-slate-900">광고 데이터를 수집하고 있습니다.</p>
            <p className="text-sm text-slate-500 mt-2">Google Ads & Meta Ad Library에서 데이터를 조회 중입니다...</p>
          </div>
        </div>
      </div>
    )
  }

  // 수집 완료 상태
  return (
    <div className="space-y-8">
      {/* 상단 기업 선택 및 필터 영역 */}
    <div className="space-y-6">
        {/* 현재 활성화 된 기업 이름 및 선택 버튼 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-900">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-2xl font-bold">
              {selectedBrand === "all" ? "전체 기업" : selectedBrand}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedBrand === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBrand("all")}
              className="rounded-full px-4"
            >
              전체
            </Button>
            {brands.map(brand => (
              <Button
                key={brand}
                variant={selectedBrand === brand ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBrand(brand)}
                className="rounded-full px-4"
              >
                {brand}
            </Button>
          ))}
          </div>
        </div>

        {/* 필터 및 요약 정보 영역 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-bold text-slate-900">수집된 광고 소재</h3>
            <span className="text-blue-600 font-bold">({filteredAds.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 기간 필터 */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px] bg-white">
                <SelectValue placeholder="기간 전체" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">기간 전체</SelectItem>
                <SelectItem value="30">최근 30일</SelectItem>
                <SelectItem value="90">최근 90일</SelectItem>
                <SelectItem value="180">최근 180일</SelectItem>
            </SelectContent>
          </Select>

            {/* 매체 필터 */}
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[160px] bg-white">
                <SelectValue placeholder="매체 전체" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">매체 전체</SelectItem>
                <SelectItem value="google">Google & YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
                <SelectItem value="threads">Threads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

        {/* 플랫폼 상세 요약 (Badge 형태) */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none px-2.5 py-1">
            Google: {platformStats.google}
          </Badge>
          
          {/* Meta 통합 수치 대신 개별 수치 표현 */}
          {platformStats.facebook > 0 && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none px-2.5 py-1 flex items-center gap-1.5">
              <Facebook className="w-3 h-3" /> Facebook: {platformStats.facebook}
            </Badge>
          )}
          {platformStats.instagram > 0 && (
            <Badge variant="secondary" className="bg-pink-50 text-pink-600 hover:bg-pink-50 border-none px-2.5 py-1 flex items-center gap-1.5">
              <Instagram className="w-3 h-3" /> Instagram: {platformStats.instagram}
            </Badge>
          )}
          {platformStats.messenger > 0 && (
            <Badge variant="secondary" className="bg-sky-50 text-sky-600 hover:bg-sky-50 border-none px-2.5 py-1 flex items-center gap-1.5">
              <Send className="w-3 h-3 rotate-[-20deg]" /> Messenger: {platformStats.messenger}
            </Badge>
          )}
          {platformStats.threads > 0 && (
            <Badge variant="secondary" className="bg-slate-50 text-slate-700 hover:bg-slate-50 border-none px-2.5 py-1 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Threads: {platformStats.threads}
            </Badge>
          )}

          {/* 전체 Meta 수치 (선택사항, 필요없으면 제거 가능) */}
          <span className="text-[10px] text-slate-300 ml-1">
            Total Meta: {platformStats.meta}
          </span>
            </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredAds.length > 0 ? (
          <motion.div 
            key={`${selectedBrand}-${selectedPlatform}-${dateFilter}`}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
          >
            {filteredAds.map((item) => (
              <AdCard 
                key={item.id}
                item={item}
                isGoogle={item.platform === 'google'}
                isMeta={item.platform === 'meta'}
                getHtmlParentId={getHtmlParentId}
                getFormatIcon={getFormatIcon}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-20 text-center"
          >
            <p className="text-slate-500">조건에 맞는 광고 소재가 없습니다.</p>
            <Button 
              variant="link" 
              onClick={() => {
                setSelectedBrand("all");
                setSelectedPlatform("all");
                setDateFilter("all");
              }}
              className="text-blue-600 mt-2"
            >
              필터 초기화하기
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
