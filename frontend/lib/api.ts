export async function callAI(action: string, payload: Record<string, unknown> = {}) {
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  const json = await r.json()
  if (!json.success) throw new Error(json.error || 'AI request failed')
  return json
}

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await fetch('/api/health', { signal: AbortSignal.timeout(3000) })
    return r.ok
  } catch {
    return false
  }
}
