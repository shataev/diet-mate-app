import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const db = getDb()

  const log = db
    .prepare('SELECT * FROM daily_log WHERE date = ?')
    .get(date) as { date: string; weight_kg: number | null; steps: number | null } | undefined

  return NextResponse.json(log ?? { date, weight_kg: null, steps: null })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date, weight_kg, steps } = body
  const db = getDb()

  db.prepare(`
    INSERT INTO daily_log (date, weight_kg, steps)
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      weight_kg = excluded.weight_kg,
      steps = excluded.steps,
      updated_at = datetime('now')
  `).run(date, weight_kg ?? null, steps ?? null)

  return NextResponse.json({ ok: true })
}
