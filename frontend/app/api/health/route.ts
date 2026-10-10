import { NextResponse } from 'next/server'

const ENGINE = process.env.AI_ENGINE_URL || 'http://localhost:3001'

export async function GET() {
  try {
    const r = await fetch(`${ENGINE}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ status: 'offline' }, { status: 503 })
  }
}
