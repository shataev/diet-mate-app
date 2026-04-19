import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db
    .prepare(`
      SELECT date, weight_kg FROM daily_log
      WHERE date >= date('now', '-6 days')
      ORDER BY date ASC
    `)
    .all() as { date: string; weight_kg: number | null }[]

  const days: { date: string; weight_kg: number | null }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const found = rows.find((r) => r.date === dateStr)
    days.push({ date: dateStr, weight_kg: found?.weight_kg ?? null })
  }

  return NextResponse.json(days)
}
