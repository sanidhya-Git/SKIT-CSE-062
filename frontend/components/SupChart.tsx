'use client'

import { useRef, useEffect } from 'react'
import type { SupportData } from '@/lib/types'

interface SupChartProps {
  data: SupportData
  height?: number
}

export default function SupChart({ data, height = 160 }: SupChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = container.clientWidth - 32
    const H = height
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const items = [
      { label: 'Critical', val: data.critical, color: '#FF453A' },
      { label: 'High',     val: data.high,     color: '#F0A020' },
      { label: 'Medium',   val: data.medium,   color: '#0A84FF' },
      { label: 'Low',      val: data.low,      color: '#30D158' },
    ]
    const max = Math.max(...items.map(i => i.val))
    const pad = { t: 8, r: 16, b: 8, l: 68 }
    const bh = Math.min(26, (H - pad.t - pad.b - items.length * 10) / items.length)
    const gap = bh + 14

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const y = pad.t + i * gap
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.font = '11px -apple-system'
      ctx.textAlign = 'right'
      ctx.fillText(item.label, pad.l - 8, y + bh / 2 + 4)
      const tw = W - pad.l - pad.r
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.beginPath()
      ctx.roundRect(pad.l, y, tw, bh, 4)
      ctx.fill()
      const fw = max > 0 ? (item.val / max) * tw : 0
      const gr = ctx.createLinearGradient(pad.l, 0, pad.l + fw, 0)
      gr.addColorStop(0, item.color + '99')
      gr.addColorStop(1, item.color)
      ctx.fillStyle = gr
      ctx.beginPath()
      ctx.roundRect(pad.l, y, fw, bh, 4)
      ctx.fill()
      ctx.fillStyle = item.color
      ctx.font = '11px -apple-system'
      ctx.textAlign = 'left'
      ctx.fillText(item.val.toString(), pad.l + fw + 6, y + bh / 2 + 4)
    }
  }, [data, height])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} height={height} />
    </div>
  )
}
