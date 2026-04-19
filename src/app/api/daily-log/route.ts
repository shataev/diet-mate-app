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

  // Pull weight from Fatsecret if not stored locally
  let weight_kg = log?.weight_kg ?? null
  if (weight_kg === null) {
    try {
      const date = new Date(dateStr + 'T12:00:00')
      weight_kg = await getWeightForDate(date)
      if (weight_kg !== null) {
        db.prepare(`
          INSERT INTO daily_log (date, weight_kg, steps)
          VALUES (?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg, updated_at = datetime('now')
        `).run(dateStr, weight_kg, log?.steps ?? null)
      }
    } catch {
      // Fatsecret unavailable — use local value
    }
  }

  return NextResponse.json({ date: dateStr, weight_kg, steps: log?.steps ?? null })
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
