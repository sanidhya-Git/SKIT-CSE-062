export type Range = 'today' | 'week' | 'month' | 'quarter'

export interface FunnelItem {
  label: string
  val: number
}

export interface SupportData {
  critical: number
  high: number
  medium: number
  low: number
}

export interface RangeData {
  rev: number[]
  labels: string[]
  sup: SupportData
  total: string
  revDelta: string
  leads: number
  leadsDelta: string
  tickets: number
  win: string
  winDelta: string
  funnel: FunnelItem[]
}

export interface Insight {
  text: string
  color: string
}

export interface ActivityItem {
  initials: string
  color: string
  title: string
  time: string
}

export interface DealItem {
  name: string
  amount: string
  stage: string
  probability: number
  color: string
}
