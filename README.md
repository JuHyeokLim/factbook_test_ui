# FactBook Frontend

FactBook 프로젝트의 프론트엔드 애플리케이션입니다.

## 기술 스택

- **Framework**: Next.js 16.0
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: Radix UI

## 로컬 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 배포 (Vercel)

자세한 배포 가이드는 [DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md)를 참조하세요.

### 빠른 배포

1. GitHub에 저장소 푸시
2. Vercel에서 프로젝트 생성
3. Root Directory: `.` (이 저장소의 루트)
4. Framework Preset: Next.js (자동 감지)
5. 환경 변수 설정:
   - `NEXT_PUBLIC_BACKEND_URL`: 백엔드 API URL

## 프로젝트 구조

```
frontend/factbook_ui_ver2/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈 페이지
│   ├── factbook/          # 팩트북 관련 페이지
│   └── admin/             # 관리자 페이지
├── components/            # React 컴포넌트
│   ├── factbook/         # 팩트북 관련 컴포넌트
│   └── ui/               # UI 컴포넌트
├── lib/                   # 유틸리티 함수
├── hooks/                 # React Hooks
├── public/                # 정적 파일
└── package.json          # 의존성 및 스크립트
```

## 주요 기능

- 팩트북 생성 및 관리
- RFP 파일 업로드 및 파싱
- 팩트북 상세 조회 및 편집
- 관리자 대시보드 (생성 로그, 메뉴 추천 로그 등)

## 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행

## 라이선스

이 프로젝트는 팀 내부 사용을 위한 것입니다.
