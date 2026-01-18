"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Check, HelpCircle, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

interface Company {
  name: string
  code: string
}

interface CompanyCandidate {
  company_name: string
  corp_code: string
  similarity: number
}

interface CompanySearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showLabel?: boolean
}

// 기업 목록 캐싱 (전역)
let companiesCache: Company[] | null = null
let cachePromise: Promise<Company[]> | null = null

// 정규화 함수
function normalizeCompanyName(name: string): string {
  const patterns = [
    "주식회사",
    "(주)",
    "㈜",
    "유한회사",
    "(유)",
    "합자회사",
    "(합)",
    "Co.,Ltd.",
    "Co., Ltd.",
    "Inc.",
    "Corp.",
    "Corporation",
    "Company",
    "Limited",
  ]

  let normalized = name
  for (const pattern of patterns) {
    normalized = normalized.replace(pattern, "")
  }

  return normalized.replace(/\s/g, "").trim().toUpperCase()
}

// 간단한 유사도 계산 (Levenshtein distance 기반)
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 100

  // 부분 일치 보너스
  if (longer.includes(shorter)) {
    return 95 + (shorter.length / longer.length) * 5
  }

  const editDistance = levenshteinDistance(str1, str2)
  return ((longer.length - editDistance) / longer.length) * 100
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

// 기업 검색 함수
function searchCompanies(query: string, companies: Company[], limit: number = 5): CompanyCandidate[] {
  const normalizedQuery = normalizeCompanyName(query)

  // 모든 기업과 유사도 계산
  const results = companies
    .map((company) => {
      const normalizedName = normalizeCompanyName(company.name)
      const similarity = calculateSimilarity(normalizedQuery, normalizedName)

      return {
        company_name: company.name,
        corp_code: company.code,
        similarity: Math.round(similarity * 10) / 10,
      }
    })
    .filter((result) => result.similarity >= 60) // 60% 이상만
    .sort((a, b) => b.similarity - a.similarity) // 유사도 순 정렬
    .slice(0, limit) // 상위 N개만

  return results
}

export function CompanySearchInput({
  value,
  onChange,
  placeholder = "기업명을 입력하세요",
  showLabel = true,
}: CompanySearchInputProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedInput = useDebounce(inputValue, 300)

  // value prop이 변경되면 inputValue 동기화
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // 초기 로딩: 기업 목록 다운로드
  useEffect(() => {
    const loadCompanies = async () => {
      if (companiesCache) return // 이미 로드됨

      if (cachePromise) {
        // 다른 인스턴스가 로딩 중
        await cachePromise
        return
      }

      setIsInitializing(true)
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
      cachePromise = fetch(`${apiUrl}/api/dart/corp-code-list`)
        .then((res) => res.json())
        .then((data: Company[]) => {
          companiesCache = data
          console.log(`✅ DART 기업 목록 로드 완료: ${data.length}개`)
          return data
        })
        .catch((error) => {
          console.error("❌ DART 기업 목록 로드 실패:", error)
          cachePromise = null
          return []
        })
        .finally(() => {
          setIsInitializing(false)
        })

      await cachePromise
    }

    loadCompanies()
  }, [])

  // 클라이언트 사이드 검색
  useEffect(() => {
    const performSearch = () => {
      if (!debouncedInput || debouncedInput.length < 2) {
        setCandidates([])
        setOpen(false)
        return
      }

      if (!companiesCache) {
        console.warn("기업 목록이 아직 로드되지 않았습니다")
        return
      }

      setIsLoading(true)
      try {
        const results = searchCompanies(debouncedInput, companiesCache, 5)
        setCandidates(results)

        if (results.length > 0) {
          setOpen(true)
        }
      } catch (error) {
        console.error("검색 실패:", error)
        setCandidates([])
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedInput])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (companyName: string) => {
    setInputValue(companyName)
    onChange(companyName)
    setOpen(false)
  }

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange(newValue)
    if (newValue.length >= 2) {
      setOpen(true)
    }
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold">기업명 <span className="text-red-600">*</span></label>
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
      )}

      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={isInitializing ? "기업 목록 로딩 중..." : placeholder}
          disabled={isInitializing}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(isLoading || isInitializing) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* 드롭다운 목록 */}
        {open && candidates.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[320px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
          >
            <div className="px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white border-b border-slate-100">
              DART 등록 기업 ({candidates.length}개)
            </div>
            <div className="overflow-y-auto py-1 bg-white">
              {candidates.map((candidate) => (
                <button
                  key={candidate.corp_code}
                  onClick={() => handleSelect(candidate.company_name)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-center gap-3 group relative"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                    value === candidate.company_name 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "bg-white border-slate-200 text-transparent group-hover:border-blue-400"
                  )}>
                    <Check className="h-3 w-3" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-semibold text-sm truncate transition-colors",
                      value === candidate.company_name ? "text-blue-600" : "text-slate-700 group-hover:text-slate-900"
                    )}>
                      {candidate.company_name}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-slate-200 transition-colors">
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-700">
                      {candidate.similarity}% 일치
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {inputValue && candidates.length === 0 && !isLoading && debouncedInput.length >= 2 && (
        <p className="text-xs text-gray-500">
          DART에 등록된 기업이 아닙니다. AI 검색으로 정보를 수집합니다.
        </p>
      )}
    </div>
  )
}

