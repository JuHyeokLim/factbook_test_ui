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
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">기업명</label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
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
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[300px] overflow-auto"
          >
            <div className="p-2 text-xs font-medium text-gray-500 border-b">
              DART 등록 기업 ({candidates.length}개)
            </div>
            {candidates.map((candidate) => (
              <button
                key={candidate.corp_code}
                onClick={() => handleSelect(candidate.company_name)}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <Check
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    value === candidate.company_name ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{candidate.company_name}</div>
                  <div className="text-xs text-gray-500">유사도: {candidate.similarity}%</div>
                </div>
              </button>
            ))}
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

