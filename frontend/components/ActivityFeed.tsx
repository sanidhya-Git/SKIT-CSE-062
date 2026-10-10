import { ACTIVITY_FEED } from '@/lib/data'

export default function ActivityFeed() {
  return (
    <div className="feed-list">
      {ACTIVITY_FEED.map((item, i) => (
        <div className="feed-item" key={i}>
          <div className="feed-avatar" style={{ background: item.color }}>
            {item.initials}
          </div>
          <div className="feed-body">
            <div className="feed-title">{item.title}</div>
            <div className="feed-time">{item.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
