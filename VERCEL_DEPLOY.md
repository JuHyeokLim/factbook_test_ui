# Vercel 배포 가이드 (프론트엔드)

FactBook 프론트엔드를 Vercel에 배포하는 상세 가이드입니다.

## 사전 준비

1. GitHub 저장소에 코드가 푸시되어 있어야 합니다
   - 저장소: `JuHyeokLim/factbook_test_ui`
2. Vercel 계정이 필요합니다 (https://vercel.com)
3. 백엔드 API URL이 필요합니다 (Render에서 배포한 백엔드 URL)

## 1단계: Vercel 프로젝트 생성

### 1.1 Vercel 대시보드 접속

1. https://vercel.com 접속 및 로그인
2. 대시보드에서 "Add New..." → "Project" 클릭

### 1.2 GitHub 저장소 연결

1. "Import Git Repository" 섹션에서
2. GitHub 계정 연결 (아직 연결하지 않았다면)
3. 저장소 선택: `JuHyeokLim/factbook_test_ui`
4. "Import" 클릭

### 1.3 프로젝트 설정

**프로젝트 설정:**
- **Project Name**: `factbook-frontend` (또는 원하는 이름)
- **Framework Preset**: `Next.js` (자동 감지됨)
- **Root Directory**: `.` (저장소 루트)
- **Build Command**: `npm run build` (자동 감지됨)
- **Output Directory**: `.next` (자동 감지됨)
- **Install Command**: `npm install` (자동 감지됨)

**고급 설정 (Advanced Settings):**
- Node.js Version: `18.x` 또는 `20.x` (권장)
- Environment Variables: 아래에서 설정

## 2단계: 환경 변수 설정

### 2.1 환경 변수 추가

프로젝트 설정 페이지의 "Environment Variables" 섹션에서:

**필수 환경 변수:**

```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.onrender.com
```

**중요**: 
- `NEXT_PUBLIC_` 접두사가 필수입니다 (Next.js에서 클라이언트 사이드에서 접근 가능하도록)
- 백엔드 URL은 Render에서 배포한 백엔드 서비스 URL입니다
- 예시: `https://factbook-backend.onrender.com`

### 2.2 환경 변수 적용 범위

각 환경 변수에 대해 적용할 환경을 선택:
- **Production**: ✅ (필수)
- **Preview**: ✅ (권장)
- **Development**: ✅ (선택)

## 3단계: 배포 실행

### 3.1 배포 시작

모든 설정이 완료되면 "Deploy" 버튼을 클릭합니다.

### 3.2 배포 과정 확인

배포가 시작되면:
1. "Building" 단계: 의존성 설치 및 빌드
2. "Deploying" 단계: 배포 진행
3. "Ready" 단계: 배포 완료

예상되는 빌드 로그:
```
Installing dependencies...
npm install
Building...
npm run build
Deploying...
```

### 3.3 배포 완료

배포가 완료되면:
- 배포 URL이 표시됩니다 (예: `https://factbook-frontend.vercel.app`)
- 이 URL을 복사해두세요

## 4단계: 배포 확인

### 4.1 프론트엔드 접속 확인

브라우저에서 배포된 URL로 접속:
- 예: `https://factbook-frontend.vercel.app`

### 4.2 API 연결 확인

1. 브라우저 개발자 도구 열기 (F12)
2. "Console" 탭 확인
3. "Network" 탭에서 API 호출 확인
4. 에러가 없다면 정상 작동

### 4.3 기능 테스트

다음 기능들을 테스트하세요:
- [ ] 팩트북 목록 조회
- [ ] 팩트북 생성
- [ ] RFP 파일 업로드
- [ ] 팩트북 상세 조회

## 5단계: 기존 프로젝트 업데이트 (이미 배포된 경우)

이미 Vercel에 배포된 프로젝트가 있다면:

### 5.1 프로젝트 설정 업데이트

1. Vercel 대시보드에서 기존 프로젝트 선택
2. "Settings" → "General" 이동
3. "Root Directory" 확인 (`.`로 설정)
4. "Environment Variables" 확인 및 업데이트

### 5.2 환경 변수 업데이트

1. "Settings" → "Environment Variables" 이동
2. `NEXT_PUBLIC_BACKEND_URL` 확인
3. 백엔드 URL이 올바른지 확인
4. 필요시 수정 후 "Save" 클릭

### 5.3 재배포

환경 변수를 변경한 경우:
1. "Deployments" 탭으로 이동
2. 최신 배포 옆 "..." 메뉴 클릭
3. "Redeploy" 선택
4. 또는 GitHub에 푸시하면 자동 재배포

## 문제 해결

### 빌드 실패

**문제**: `npm run build` 실패

**해결책**:
1. 빌드 로그 확인
2. `package.json`의 `build` 스크립트 확인
3. TypeScript 에러 확인
4. 의존성 문제 확인

### API 연결 실패

**문제**: 프론트엔드에서 백엔드 API 호출 실패

**해결책**:
1. `NEXT_PUBLIC_BACKEND_URL` 환경 변수 확인
2. 백엔드 URL이 올바른지 확인 (https://로 시작)
3. CORS 설정 확인 (백엔드)
4. 브라우저 콘솔에서 에러 메시지 확인

### CORS 오류

**문제**: CORS 관련 에러 발생

**해결책**:
1. 백엔드 `main.py`의 CORS 설정 확인
2. Vercel 도메인을 `allow_origins`에 추가:
   ```python
   allow_origins=[
       "https://factbook-frontend.vercel.app",
       "https://*.vercel.app",  # 모든 Vercel 프리뷰 도메인
   ]
   ```

### 환경 변수가 적용되지 않음

**문제**: `NEXT_PUBLIC_BACKEND_URL`이 작동하지 않음

**해결책**:
1. 환경 변수 이름에 `NEXT_PUBLIC_` 접두사 확인
2. 재배포 필요 (환경 변수 변경 후)
3. 빌드 로그에서 환경 변수 확인

## 환경 변수 체크리스트

배포 전 확인:

- [ ] `NEXT_PUBLIC_BACKEND_URL` - 백엔드 API URL (https://로 시작)
- [ ] 환경 변수가 Production, Preview, Development에 모두 적용되었는지 확인

## 자동 배포 설정

### GitHub 푸시 시 자동 배포

기본적으로 Vercel은:
- `main` 브랜치에 푸시하면 Production 배포
- 다른 브랜치에 푸시하면 Preview 배포

### 배포 알림

Vercel은 다음으로 알림을 보낼 수 있습니다:
- 이메일
- Slack
- Discord
- GitHub

## 커스텀 도메인 설정 (선택사항)

1. "Settings" → "Domains" 이동
2. 원하는 도메인 추가
3. DNS 설정 안내에 따라 설정

## 성능 최적화

Vercel은 자동으로:
- CDN을 통한 글로벌 배포
- 이미지 최적화
- 코드 스플리팅
- 자동 HTTPS

## 다음 단계

프론트엔드 배포가 완료되면:

1. 팀원들에게 배포 URL 공유
2. 백엔드 CORS 설정 업데이트 (필요시)
3. 기능 테스트 진행

## 참고 자료

- Vercel 공식 문서: https://vercel.com/docs
- Next.js 배포 가이드: https://nextjs.org/docs/deployment
- 환경 변수 설정: https://vercel.com/docs/concepts/projects/environment-variables

