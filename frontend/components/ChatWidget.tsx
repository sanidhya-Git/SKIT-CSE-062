'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useApp } from '@/context/AppContext'
import { callAI } from '@/lib/api'

interface Message {
  role: 'ai' | 'user' | 'typing'
  text: string
}

export default function ChatWidget() {
  const { chatOpen, setChatOpen, serverOk } = useApp()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Hi! I\'m your OneOps AI assistant. Ask me about leads, revenue, support tickets, or any business question.' },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
    }
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])

    if (!serverOk) {
      setMessages(prev => [...prev, { role: 'ai', text: 'AI engine is offline. Please start the ai-engine service.' }])
      return
    }

    setSending(true)
    setMessages(prev => [...prev, { role: 'typing', text: 'Thinking…' }])
    try {
      const res = await callAI('chat', { message: text, userId: 'dashboard', userName: 'User' })
      setMessages(prev => {
        const next = prev.filter(m => m.role !== 'typing')
        return [...next, { role: 'ai', text: res.data.reply || 'No response.' }]
      })
    } catch {
      setMessages(prev => {
        const next = prev.filter(m => m.role !== 'typing')
        return [...next, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]
      })
    } finally {
      setSending(false)
    }
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send()
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setChatOpen(!chatOpen)} title="AI Chat">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" />
        </svg>
      </button>

      <div className={`chat-panel${chatOpen ? '' : ' hidden'}`}>
        <div className="chat-head">
          <div className="chat-head-dot" />
          <div>
            <div className="chat-head-title">OneOps AI</div>
            <div className="chat-head-sub">Ask me anything about your business</div>
          </div>
        </div>
        <div className="chat-msgs" ref={msgsRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>{m.text}</div>
          ))}
        </div>
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Ask anything…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
          />
          <button className="chat-send" onClick={send} disabled={sending || !input.trim()}>
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </>
  )
}
