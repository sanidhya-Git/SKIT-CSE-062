import { NextRequest, NextResponse } from 'next/server'

const ENGINE = process.env.AI_ENGINE_URL || 'http://localhost:3001'
const TOKEN = process.env.AI_TOKEN || 'dev-secret-for-local-testing'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const r = await fetch(`${ENGINE}/api/v1/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify(body),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch {
    return NextResponse.json({ success: false, error: 'AI engine unreachable' }, { status: 503 })
  }
}
