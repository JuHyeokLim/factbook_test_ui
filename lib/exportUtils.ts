import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx"
import { saveAs } from "file-saver"

interface Source {
  title: string
  content: string
  media: string
  url?: string
  imageUrl?: string
}

interface VisualizationItem {
  id: string
  component: "BarChart" | "LineChart" | "DonutChart" | "AreaChart"
  title?: string
  data?: Record<string, any>[]
  index?: string
  categories?: string[]
  category?: string
  value?: string
  colors?: string[]
}

interface SubSection {
  id: string
  title: string
  content: string
  visualizations?: VisualizationItem[]
  sources?: Source[]
}

interface Section {
  id: string
  title: string
  subSections: SubSection[]
  sources?: Source[]
}

interface FactbookDetail {
  id: string
  companyName: string
  productName: string
  category: string
  sections: Section[]
}

// 마크다운 텍스트를 docx Paragraph로 변환하는 함수
const parseMarkdownToParagraphs = (markdown: string): Paragraph[] => {
  const paragraphs: Paragraph[] = []
  const lines = markdown.split("\n")
  
  let inList = false
  let listItems: string[] = []
  let inTable = false
  let tableRows: string[][] = []
  
  const flushList = () => {
    if (listItems.length > 0) {
      listItems.forEach((item) => {
        paragraphs.push(
          new Paragraph({
            text: `• ${item}`,
            spacing: { before: 100, after: 100 },
            indent: { left: 720 },
          })
        )
      })
      listItems = []
    }
  }
  
  const flushTable = () => {
    if (tableRows.length > 0) {
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows.map((row, rowIndex) => 
          new TableRow({
            children: row.map((cell) => 
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: cell.trim(),
                        bold: rowIndex === 0,
                      }),
                    ],
                  }),
                ],
                shading: rowIndex === 0 ? { fill: "E5E7EB" } : undefined,
              })
            ),
          })
        ),
      })
      paragraphs.push(table as any)
      tableRows = []
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 테이블 처리
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      if (!inTable) {
        inTable = true
      }
      
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
      
      // 구분선 제외 (---|---|--- 형태)
      if (!cells.every((cell) => /^[-:]+$/.test(cell))) {
        tableRows.push(cells)
      }
      continue
    } else if (inTable) {
      flushTable()
      inTable = false
    }
    
    // 리스트 처리
    if (line.trim().match(/^[-*]\s+(.+)$/)) {
      if (!inList) {
        inList = true
      }
      const match = line.trim().match(/^[-*]\s+(.+)$/)
      if (match) {
        listItems.push(match[1])
      }
      continue
    } else if (inList) {
      flushList()
      inList = false
    }
    
    // 제목 처리
    if (line.startsWith("####")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^####\s+/, ""),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 240, after: 120 },
        })
      )
    } else if (line.startsWith("###")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^###\s+/, ""),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        })
      )
    } else if (line.startsWith("##")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^##\s+/, ""),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 120 },
        })
      )
    } else if (line.startsWith("#")) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^#\s+/, ""),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 240 },
        })
      )
    } else if (line.trim() === "") {
      // 빈 줄
      paragraphs.push(
        new Paragraph({
          text: "",
          spacing: { before: 120, after: 120 },
        })
      )
    } else {
      // 일반 텍스트 - 볼드, 이탤릭, 인용 번호 처리
      const textRuns: TextRun[] = []
      let currentText = line
      
      // [숫자] 형태의 인용 제거 (출처는 별도로 표시)
      currentText = currentText.replace(/\[(\d+)\]/g, "[$1]")
      
      // 간단한 볼드/이탤릭 처리
      const parts = currentText.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/)
      
      parts.forEach((part) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          textRuns.push(
            new TextRun({
              text: part.slice(2, -2),
              bold: true,
            })
          )
        } else if (part.startsWith("*") && part.endsWith("*")) {
          textRuns.push(
            new TextRun({
              text: part.slice(1, -1),
              italics: true,
            })
          )
        } else if (part.startsWith("`") && part.endsWith("`")) {
          textRuns.push(
            new TextRun({
              text: part.slice(1, -1),
              font: "Courier New",
            })
          )
        } else if (part) {
          textRuns.push(new TextRun(part))
        }
      })
      
      if (textRuns.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: { before: 100, after: 100 },
          })
        )
      }
    }
  }
  
  // 남은 리스트나 테이블 처리
  flushList()
  flushTable()
  
  return paragraphs
}

// 시각화 데이터를 테이블로 변환
const visualizationToTable = (viz: VisualizationItem): Paragraph[] => {
  const paragraphs: Paragraph[] = []
  
  // 제목 추가
  if (viz.title) {
    paragraphs.push(
      new Paragraph({
        text: viz.title,
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 240, after: 120 },
      })
    )
  }
  
  // 데이터가 있으면 테이블로 변환
  if (viz.data && viz.data.length > 0) {
    const data = viz.data
    const indexKey = viz.index || viz.category || "category"
    const categoryKeys = (viz.categories && viz.categories.length > 0) 
      ? viz.categories 
      : [viz.value || "value"]
    
    // 헤더 행
    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: indexKey, bold: true })],
            }),
          ],
          shading: { fill: "E5E7EB" },
        }),
        ...categoryKeys.map(
          (key) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: key, bold: true })],
                }),
              ],
              shading: { fill: "E5E7EB" },
            })
        ),
      ],
    })
    
    // 데이터 행
    const dataRows = data.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  text: String(row[indexKey] || ""),
                }),
              ],
            }),
            ...categoryKeys.map(
              (key) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(row[key] || ""),
                    }),
                  ],
                })
            ),
          ],
        })
    )
    
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows],
    })
    
    paragraphs.push(table as any)
  } else {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[${viz.component} 차트 데이터]`,
            italics: true,
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    )
  }
  
  return paragraphs
}

// 팩트북을 Word 문서로 내보내기
export const exportFactbookToWord = async (factbook: FactbookDetail) => {
  const children: (Paragraph | Table)[] = []
  
  // 제목
  children.push(
    new Paragraph({
      text: `${factbook.companyName} ${factbook.productName}`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 480 },
    })
  )
  
  // 카테고리
  if (factbook.category) {
    children.push(
      new Paragraph({
        text: `카테고리: ${factbook.category}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 360 },
      })
    )
  }
  
  // 섹션별 내용
  factbook.sections.forEach((section, sectionIndex) => {
    // 섹션 제목
    children.push(
      new Paragraph({
        text: `${sectionIndex + 1}. ${section.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 480, after: 240 },
      })
    )
    
    // 서브섹션
    section.subSections.forEach((subSection) => {
      // 서브섹션 제목
      children.push(
        new Paragraph({
          text: subSection.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 180 },
        })
      )
      
      // 내용 파싱
      let content = subSection.content || ""
      
      // {{CHART_ID}} 패턴 처리
      const visualizations = subSection.visualizations || []
      const regex = /\{\{([A-Z0-9_]+)\}\}/g
      const parts: string[] = []
      const chartPositions: { index: number; chartId: string }[] = []
      
      let lastIndex = 0
      let match: RegExpExecArray | null
      
      while ((match = regex.exec(content)) !== null) {
        parts.push(content.slice(lastIndex, match.index))
        chartPositions.push({ index: parts.length, chartId: match[1] })
        parts.push("") // 차트 위치 플레이스홀더
        lastIndex = regex.lastIndex
      }
      parts.push(content.slice(lastIndex))
      
      // 텍스트와 차트를 순서대로 추가
      parts.forEach((part, index) => {
        if (part.trim()) {
          children.push(...parseMarkdownToParagraphs(part))
        }
        
        // 차트 추가
        const chartPos = chartPositions.find((cp) => cp.index === index)
        if (chartPos) {
          const viz = visualizations.find((v) => v.id === chartPos.chartId)
          if (viz) {
            children.push(...visualizationToTable(viz))
          }
        }
      })
      
      // 본문에 삽입되지 않은 차트들 추가
      const usedChartIds = new Set(chartPositions.map((cp) => cp.chartId))
      const unusedVisualizations = visualizations.filter((v) => !usedChartIds.has(v.id))
      unusedVisualizations.forEach((viz) => {
        children.push(...visualizationToTable(viz))
      })
      
      // 출처 정보 추가
      if (subSection.sources && subSection.sources.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "출처:",
                bold: true,
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        )
        
        subSection.sources.forEach((source, idx) => {
          if (source.url) {
            children.push(
              new Paragraph({
                text: `[${idx + 1}] ${source.title || source.url}`,
                spacing: { before: 60, after: 60 },
                indent: { left: 360 },
              })
            )
            
            if (source.url !== source.title) {
              children.push(
                new Paragraph({
                  text: source.url,
                  spacing: { before: 30, after: 60 },
                  indent: { left: 720 },
                })
              )
            }
          }
        })
      }
      
      // 서브섹션 구분선
      children.push(
        new Paragraph({
          text: "",
          spacing: { before: 240, after: 240 },
        })
      )
    })
  })
  
  // 문서 생성
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children as Paragraph[],
      },
    ],
  })
  
  // 파일명 생성
  const fileName = `팩트북 AI_${factbook.companyName}_${factbook.productName}.docx`
  
  // 문서 생성 및 다운로드
  const { Packer } = await import("docx")
  const blob = await Packer.toBlob(doc)
  saveAs(blob, fileName)
}

