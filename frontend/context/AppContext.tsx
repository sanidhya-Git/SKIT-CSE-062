'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { checkHealth } from '@/lib/api'
import type { Range } from '@/lib/types'

interface AppContextValue {
  range: Range
  setRange: (r: Range) => void
  serverOk: boolean
  chatOpen: boolean
  setChatOpen: (v: boolean) => void
  scorerOpen: boolean
  setScorerOpen: (v: boolean) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<Range>('today')
  const [serverOk, setServerOk] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [scorerOpen, setScorerOpen] = useState(false)

  const refresh = useCallback(async () => {
    setServerOk(await checkHealth())
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30000)
    return () => clearInterval(t)
  }, [refresh])

  return (
    <AppContext.Provider value={{ range, setRange, serverOk, chatOpen, setChatOpen, scorerOpen, setScorerOpen }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
