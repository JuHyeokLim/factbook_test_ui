// Tremor Chart Utilities
// Tremor v3에서 차트 색상을 관리하는 파일

export const chartColors = {
  blue: "blue",
  cyan: "cyan",
  emerald: "emerald",
  violet: "violet",
  amber: "amber",
  gray: "gray",
  pink: "pink",
  lime: "lime",
  fuchsia: "fuchsia",
  green: "green",
  red: "red",
  indigo: "indigo",
  purple: "purple",
  yellow: "yellow",
  teal: "teal",
  orange: "orange",
  sky: "sky",
  rose: "rose",
} as const;

export type AvailableChartColorsKeys = keyof typeof chartColors;

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
  chartColors
) as AvailableChartColorsKeys[];

// Tremor에서 사용하는 색상 변형 (50~950)
export const chartColorVariants = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

