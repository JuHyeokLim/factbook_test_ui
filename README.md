# Factbook UI v2

AI 기반 팩트북 자동 생성 시스템 프론트엔드

## 🚀 기술 스택

- **Framework**: Next.js 16.0.0 (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

## 📋 주요 기능

### 1. 팩트북 생성 (3단계)
- **Step 1**: 기본정보 입력 (RFP 업로드 / 직접 입력)
- **Step 2**: 추가정보 입력 (제안 내용, 경쟁사, 타겟 사용자)
- **Step 3**: 메뉴 구성 (6가지 분석 항목 설정)

### 2. 팩트북 리스트
- 검색 및 필터링 (업종, 정렬)
- 그리드/리스트 뷰 전환
- 팩트북 생성 상태 표시

### 3. 팩트북 상세
- **팩트북 탭**: 기업정보, 시장분석, 자사분석, 경쟁사분석, 타겟분석
- **매체소재 탭**: 회사별/경쟁사별 광고 소재 수집 및 필터링

## 🛠️ 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 📁 프로젝트 구조

```
factbook_ui_ver2/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── factbook/          # 팩트북 상세 페이지
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── factbook/         # 팩트북 관련 컴포넌트
│   └── ui/               # UI 컴포넌트
├── hooks/                 # Custom Hooks
└── lib/                   # 유틸리티 함수
```

## 🌐 배포

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 자동 배포 완료!

### 환경 변수

필요한 경우 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=your_api_url
```

## 📝 라이선스

MIT
