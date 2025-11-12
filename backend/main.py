from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
import httpx
import json

load_dotenv()

app = FastAPI(title="AI Agent Factbook API")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class CompetitorInfo(BaseModel):
    name: str
    description: Optional[str] = None

class FactbookBase(BaseModel):
    company_name: str
    product_name: str
    category: str
    competitors: List[str]
    proposal_areas: List[str]
    advertising_types: List[str]

class FactbookCreate(FactbookBase):
    pass

class Source(BaseModel):
    title: str
    content: str
    media: str
    url: str

class Section(BaseModel):
    id: str
    title: str
    content: str
    sources: List[Source]

class FactbookDetail(FactbookBase):
    id: str
    sections: List[Section]
    created_at: str
    updated_at: str
    view_count: int = 0

class ExtractedRFPData(BaseModel):
    company_name: str
    product_name: str
    competitors: List[str]
    proposal_areas: List[str]
    category: Optional[str] = None

# LLM 설정
LLM_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = "gpt-4"

async def extract_rfp_content(file_content: bytes, file_name: str) -> ExtractedRFPData:
    """RFP 파일에서 정보 추출"""
    try:
        # 파일 타입에 따라 텍스트 추출 (실제 구현)
        # PDF, PPTX, DOCX, HWP 지원 필요
        
        # OpenAI API를 통한 정보 추출
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {LLM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert at extracting structured business information from RFP documents. Extract and return JSON with: company_name, product_name, competitors (list), proposal_areas (list), category.",
                        },
                        {
                            "role": "user",
                            "content": f"Extract information from this RFP file: {file_name}",
                        },
                    ],
                    "temperature": 0.7,
                },
            )

        if response.status_code == 200:
            result = response.json()
            extracted_text = result["choices"][0]["message"]["content"]
            data = json.loads(extracted_text)
            return ExtractedRFPData(**data)
        else:
            raise HTTPException(status_code=500, detail="LLM API 호출 실패")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RFP 처리 중 오류: {str(e)}")

async def generate_factbook_sections(factbook_data: FactbookCreate) -> List[Section]:
    """AI를 사용하여 팩트북 섹션 생성"""
    sections_template = [
        "회사 및 브랜드 소개",
        "시장분석",
        "자사분석",
        "경쟁사분석",
        "타겟분석",
        "광고분석",
    ]

    sections = []
    try:
        async with httpx.AsyncClient() as client:
            for idx, section_title in enumerate(sections_template):
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {LLM_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": LLM_MODEL,
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a business analyst creating comprehensive factbooks about companies. Create informative, professional content.",
                            },
                            {
                                "role": "user",
                                "content": f"Create a {section_title} section for {factbook_data.company_name} ({factbook_data.product_name}). Competitors: {', '.join(factbook_data.competitors)}. Include 2-3 sentences.",
                            },
                        ],
                        "temperature": 0.7,
                    },
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    sections.append(
                        Section(
                            id=str(idx + 1),
                            title=section_title,
                            content=content,
                            sources=[
                                Source(
                                    title=f"{section_title} 정보",
                                    content=f"{factbook_data.company_name}에 대한 {section_title.lower()} 분석",
                                    media="AI 생성 콘텐츠",
                                    url="#",
                                )
                            ],
                        )
                    )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팩트북 생성 중 오류: {str(e)}")

    return sections

# API Routes
@app.post("/api/extract-rfp", response_model=ExtractedRFPData)
async def extract_rfp(file: UploadFile = File(...)):
    """RFP 파일을 업로드하고 정보 추출"""
    try:
        # 파일 검증
        valid_extensions = ['.pdf', '.pptx', '.docx', '.hwp']
        if not any(file.filename.endswith(ext) for ext in valid_extensions):
            raise HTTPException(status_code=400, detail="유효하지 않은 파일 형식")

        # 파일 크기 검증 (10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="파일이 너무 큽니다.")

        # 파일 처리 및 정보 추출
        extracted_data = await extract_rfp_content(contents, file.filename)
        return extracted_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/factbooks", response_model=dict)
async def create_factbook(factbook: FactbookCreate):
    """새로운 팩트북 생성"""
    try:
        # AI를 사용하여 팩트북 섹션 생성
        sections = await generate_factbook_sections(factbook)

        # 데이터베이스에 저장 (실제 구현)
        # db.add_factbook(...)

        return {
            "id": "generated_id",
            "message": "팩트북이 생성되었습니다.",
            "sections": sections,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/factbooks")
async def list_factbooks(
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort_by: str = "recent",
):
    """팩트북 목록 조회"""
    # 실제 구현에서는 데이터베이스 쿼리
    return {
        "factbooks": [],
        "total": 0,
    }

@app.get("/api/factbooks/{factbook_id}", response_model=FactbookDetail)
async def get_factbook(factbook_id: str):
    """팩트북 상세 조회"""
    # 실제 구현에서는 데이터베이스 조회
    raise HTTPException(status_code=404, detail="팩트북을 찾을 수 없습니다.")

@app.delete("/api/factbooks/{factbook_id}")
async def delete_factbook(factbook_id: str):
    """팩트북 삭제"""
    # 실제 구현에서는 데이터베이스 삭제
    return {"message": "팩트북이 삭제되었습니다."}

@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
