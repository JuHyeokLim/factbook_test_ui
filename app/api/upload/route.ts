import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
    }

    // 파일 검증
    const validExtensions = [".pdf", ".pptx", ".docx"]
    const hasValidExtension = validExtensions.some((ext) => file.name.endsWith(ext))
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!hasValidExtension || file.size > maxSize) {
      return NextResponse.json(
        { error: "유효하지 않은 파일입니다. (10MB 이하의 pdf, pptx, docx)" },
        { status: 400 },
      )
    }

    // 실제 구현에서는 FastAPI 백엔드로 전송 또는 클라우드 스토리지에 저장
    // 여기서는 FastAPI 백엔드로 전달한다고 가정
    const backendFormData = new FormData()
    backendFormData.append("file", file)

    // FastAPI 백엔드 호출 (환경변수로 설정)
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
    const response = await fetch(`${backendUrl}/api/extract-rfp`, {
      method: "POST",
      body: backendFormData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "RFP 처리 실패" }))
      throw new Error(errorData.detail || "RFP 처리 실패")
    }

    const result = await response.json()

    // 백엔드 응답 형식: { success: true, data: {...} }
    // 프론트엔드에서 사용하기 쉽게 data만 반환
    return NextResponse.json(result.data || result)
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "파일 업로드 중 오류가 발생했습니다." }, { status: 500 })
  }
}
