export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getWeightForDate } from '@/lib/fatsecret'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const db = getDb()

  const log = db
    .prepare('SELECT * FROM daily_log WHERE date = ?')
    .get(dateStr) as { date: string; weight_kg: number | null; steps: number | null } | undefined

  const date = new Date(dateStr + 'T12:00:00')

  let weight_kg = log?.weight_kg ?? null
  let steps = log?.steps ?? null

  const [fsWeight] = await Promise.allSettled([
    weight_kg === null ? getWeightForDate(date) : Promise.resolve(null),
  ])

  if (fsWeight.status === 'fulfilled' && fsWeight.value !== null) {
    weight_kg = fsWeight.value
  }

  if (weight_kg !== (log?.weight_kg ?? null) || steps !== (log?.steps ?? null)) {
    db.prepare(`
      INSERT INTO daily_log (date, weight_kg, steps)
      VALUES (?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        weight_kg = COALESCE(excluded.weight_kg, weight_kg),
        steps = COALESCE(excluded.steps, steps),
        updated_at = datetime('now')
    `).run(dateStr, weight_kg, steps)
  }

  return NextResponse.json({ date: dateStr, weight_kg, steps })
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.DIET_MATE_API_KEY
  if (apiKey) {
    const auth = request.headers.get('x-api-key')
    if (auth !== apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

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
