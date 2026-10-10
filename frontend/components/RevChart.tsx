'use client'

import { useRef, useEffect } from 'react'

interface RevChartProps {
  vals: number[]
  labels: string[]
  height?: number
}

export default function RevChart({ vals, labels, height = 160 }: RevChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || vals.length < 2) return

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

    const pad = { t: 10, r: 10, b: 28, l: 42 }
    const cw = W - pad.l - pad.r
    const ch = H - pad.t - pad.b
    const max = Math.max(...vals) * 1.15
    const px = (i: number) => pad.l + i * (cw / (vals.length - 1))
    const py = (v: number) => pad.t + ch - (v / max) * ch

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let g = 0; g <= 4; g++) {
      const gy = pad.t + g * (ch / 4)
      ctx.beginPath()
      ctx.moveTo(pad.l, gy)
      ctx.lineTo(pad.l + cw, gy)
      ctx.stroke()
      const gv = max * (1 - g / 4)
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.font = '10px -apple-system'
      ctx.textAlign = 'right'
      ctx.fillText(gv >= 1000 ? `${(gv / 1000).toFixed(0)}k` : Math.round(gv).toString(), pad.l - 5, gy + 4)
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch)
    grad.addColorStop(0, 'rgba(240,160,32,0.35)')
    grad.addColorStop(0.5, 'rgba(191,90,242,0.12)')
    grad.addColorStop(1, 'rgba(10,132,255,0.02)')
    ctx.beginPath()
    ctx.moveTo(px(0), py(vals[0]))
    for (let i = 1; i < vals.length; i++) {
      const cpx = (px(i - 1) + px(i)) / 2
      ctx.bezierCurveTo(cpx, py(vals[i - 1]), cpx, py(vals[i]), px(i), py(vals[i]))
    }
    ctx.lineTo(px(vals.length - 1), pad.t + ch)
    ctx.lineTo(px(0), pad.t + ch)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    ctx.moveTo(px(0), py(vals[0]))
    for (let i = 1; i < vals.length; i++) {
      const cpx = (px(i - 1) + px(i)) / 2
      ctx.bezierCurveTo(cpx, py(vals[i - 1]), cpx, py(vals[i]), px(i), py(vals[i]))
    }
    ctx.strokeStyle = 'rgba(240,160,32,0.9)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Dots
    for (let k = 0; k < vals.length; k++) {
      ctx.beginPath()
      ctx.arc(px(k), py(vals[k]), 3, 0, Math.PI * 2)
      ctx.fillStyle = '#F0A020'
      ctx.fill()
    }

    // X labels
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.font = '10px -apple-system'
    ctx.textAlign = 'center'
    const step = Math.max(1, Math.floor(labels.length / 6))
    for (let l = 0; l < labels.length; l++) {
      if (l % step === 0) ctx.fillText(labels[l], px(l), H - 6)
    }
  }, [vals, labels, height])

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={canvasRef} height={height} />
    </div>
  )
}
