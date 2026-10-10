'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'

export default function Titlebar() {
  const { serverOk } = useApp()
  const [time, setTime] = useState('')

  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="titlebar">
      <div className="traffic-lights">
        <div className="tl tl-r" />
        <div className="tl tl-y" />
        <div className="tl tl-g" />
      </div>
      <div className="win-title">OneOps AI — Dashboard</div>
      <div className="server-status">
        <div className={`server-dot${serverOk ? ' ok' : ' err'}`} />
        <span className="server-label">{serverOk ? 'AI Online' : 'Offline'}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 8 }}>{time}</span>
      </div>
    </div>
  )
}
