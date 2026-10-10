import type { RangeData, Insight, ActivityItem, DealItem } from './types'

export const DATA: Record<string, RangeData> = {
  today: {
    rev: [41, 58, 45, 72, 63, 88, 76, 95, 82, 110, 98, 120],
    labels: ['8am', '9', '10', '11', '12pm', '1', '2', '3', '4', '5', '6', '7'],
    sup: { critical: 3, high: 8, medium: 11, low: 6 },
    total: '$4,820', revDelta: '+12%',
    leads: 142, leadsDelta: '+8', tickets: 28, win: '68%', winDelta: '+3%',
    funnel: [
      { label: 'Prospects', val: 320 },
      { label: 'Qualified', val: 214 },
      { label: 'Proposed', val: 142 },
      { label: 'Negotiating', val: 89 },
      { label: 'Won', val: 52 },
    ],
  },
  week: {
    rev: [380, 420, 395, 480, 510, 460, 520],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    sup: { critical: 18, high: 42, medium: 67, low: 31 },
    total: '$31.6k', revDelta: '+9%',
    leads: 897, leadsDelta: '+64', tickets: 158, win: '71%', winDelta: '+2%',
    funnel: [
      { label: 'Prospects', val: 1240 },
      { label: 'Qualified', val: 897 },
      { label: 'Proposed', val: 612 },
      { label: 'Negotiating', val: 344 },
      { label: 'Won', val: 188 },
    ],
  },
  month: {
    rev: [1800, 2100, 1980, 2340, 2560, 2210, 2780, 2950, 2640, 3100, 3280, 3520],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    sup: { critical: 74, high: 182, medium: 264, low: 118 },
    total: '$142k', revDelta: '+18%',
    leads: 3840, leadsDelta: '+280', tickets: 638, win: '73%', winDelta: '+5%',
    funnel: [
      { label: 'Prospects', val: 5200 },
      { label: 'Qualified', val: 3840 },
      { label: 'Proposed', val: 2610 },
      { label: 'Negotiating', val: 1480 },
      { label: 'Won', val: 820 },
    ],
  },
  quarter: {
    rev: [38000, 42000, 47000, 51000],
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    sup: { critical: 210, high: 540, medium: 780, low: 340 },
    total: '$1.78M', revDelta: '+22%',
    leads: 14200, leadsDelta: '+1.2k', tickets: 1870, win: '76%', winDelta: '+8%',
    funnel: [
      { label: 'Prospects', val: 18000 },
      { label: 'Qualified', val: 14200 },
      { label: 'Proposed', val: 9800 },
      { label: 'Negotiating', val: 5400 },
      { label: 'Won', val: 3100 },
    ],
  },
}

export const COLORS = ['#0A84FF', '#30D158', '#F0A020', '#BF5AF2', '#FF9F0A']

export const STATIC_INSIGHTS: Insight[] = [
  { text: 'Revenue momentum is strongest on Thursdays — consider scheduling demos mid-week.', color: '#30D158' },
  { text: '3 leads in "Negotiating" stage idle for 7+ days. AI suggests follow-up emails.', color: '#F0A020' },
  { text: 'Critical ticket volume 40% above weekly average. Consider escalating team capacity.', color: '#FF453A' },
  { text: 'Win rate improved 3pp this quarter. Deal size correlation is +0.72.', color: '#0A84FF' },
]

export const ACTIVITY_FEED: ActivityItem[] = [
  { initials: 'SJ', color: '#0A84FF', title: 'Sarah Johnson scored 87/100 by AI', time: '2 min ago' },
  { initials: 'AR', color: '#30D158', title: 'Acme Corp deal moved to Negotiating', time: '8 min ago' },
  { initials: 'TK', color: '#BF5AF2', title: 'Ticket #4821 escalated to Critical', time: '15 min ago' },
  { initials: 'ML', color: '#F0A020', title: 'Vendor EcoTech score updated: 91/100', time: '31 min ago' },
  { initials: 'DW', color: '#FF453A', title: 'Dave Wilson opportunity created $42k', time: '1h ago' },
]

export const SAMPLE_DEALS: DealItem[] = [
  { name: 'Acme Corp Enterprise', amount: '$84k', stage: 'Negotiating', probability: 72, color: '#0A84FF' },
  { name: 'TechFlow Inc', amount: '$42k', stage: 'Proposed', probability: 55, color: '#30D158' },
  { name: 'GlobalOps Ltd', amount: '$126k', stage: 'Negotiating', probability: 81, color: '#F0A020' },
  { name: 'DataVault Systems', amount: '$38k', stage: 'Qualified', probability: 34, color: '#BF5AF2' },
  { name: 'NovaStar Solutions', amount: '$67k', stage: 'Proposed', probability: 61, color: '#FF9F0A' },
]

export const SAMPLE_VENDORS = [
  { name: 'CloudPeak Supplies', totalPOs: 120, onTimePOs: 112, totalSpend: 480000, currentScore: 88 },
  { name: 'EcoTech Materials', totalPOs: 85, onTimePOs: 83, totalSpend: 210000, currentScore: 94 },
  { name: 'FastShip Logistics', totalPOs: 200, onTimePOs: 174, totalSpend: 620000, currentScore: 76 },
  { name: 'PrimeParts Co', totalPOs: 60, onTimePOs: 51, totalSpend: 145000, currentScore: 71 },
]
