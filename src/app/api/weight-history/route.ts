export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endDateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const endDate = new Date(endDateStr + 'T12:00:00')

  const days: { date: string; weight_kg: number | null }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    days.push({ date: d.toISOString().slice(0, 10), weight_kg: null })
  }

  const db = getDb()
  const rows = db
    .prepare(`SELECT date, weight_kg FROM daily_log WHERE date >= ? AND date <= ? ORDER BY date ASC`)
    .all(days[0].date, endDateStr) as { date: string; weight_kg: number | null }[]

  return NextResponse.json(
    days.map((d) => ({
      ...d,
      weight_kg: rows.find((r) => r.date === d.date)?.weight_kg ?? null,
    }))
  )
}
