interface StatCardProps {
  label: string
  value: string | number
  sub: string
  badge: string
  badgeClass?: 'badge-up' | 'badge-down' | 'badge-neutral'
  valueColor?: string
}

export default function StatCard({ label, value, sub, badge, badgeClass = 'badge-up', valueColor }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </div>
      <div className="stat-sub">{sub}</div>
      <div className={`stat-badge ${badgeClass}`}>{badge}</div>
    </div>
  )
}
