export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDailyNutrition } from '@/lib/nutrition'
import { getWeightForDate } from '@/lib/fatsecret'
import { Goals, DailyNutrition } from '@/types'

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const today = new Date().toISOString().slice(0, 10)
  const weekStart = searchParams.get('weekStart') ?? getMondayOf(today)

  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    if (dateStr <= today) days.push(dateStr)
  }

  const db = getDb()
  const goals = db.prepare('SELECT * FROM goals WHERE id = 1').get() as Goals

  const results = await Promise.all(
    days.map(async (dateStr) => {
      const date = new Date(dateStr + 'T12:00:00')
      const log = db.prepare('SELECT weight_kg, steps FROM daily_log WHERE date = ?').get(dateStr) as
        | { weight_kg: number | null; steps: number | null }
        | undefined

      let weight_kg = log?.weight_kg ?? null
      let steps = log?.steps ?? null

      const [nutrition, fsWeight] = await Promise.all([
        getDailyNutrition(date),
        weight_kg === null ? getWeightForDate(date).catch(() => null) : Promise.resolve(null),
      ])

      if (fsWeight !== null) weight_kg = fsWeight

      if (fsWeight !== null) {
        db.prepare(`
          INSERT INTO daily_log (date, weight_kg, steps)
          VALUES (?, ?, ?)
          ON CONFLICT(date) DO UPDATE SET
            weight_kg = COALESCE(excluded.weight_kg, weight_kg),
            steps = COALESCE(excluded.steps, steps),
            updated_at = datetime('now')
        `).run(dateStr, weight_kg, steps)
      }

      return {
        date: dateStr,
        nutrition,
        weight_kg,
        steps,
        hits: computeHits(nutrition, goals),
      }
    })
  )

  const avgSteps = Math.round(
    results.filter((r) => r.steps !== null).reduce((s, r) => s + (r.steps ?? 0), 0) /
      (results.filter((r) => r.steps !== null).length || 1)
  )

  return NextResponse.json({ days: results, goals, avgSteps })
}

function computeHits(nutrition: DailyNutrition, goals: Goals): Record<string, boolean> {
  return {
    calories: nutrition.calories > 0 && nutrition.calories <= goals.calories,
    protein: nutrition.protein_g >= goals.protein_g,
    vegetables: nutrition.vegetables_g >= goals.vegetables_g,
    avocado: nutrition.avocado_g >= goals.avocado_g,
    calcium: nutrition.calcium_mg >= goals.calcium_mg,
    omega3: nutrition.omega3_g >= goals.omega3_g,
    eggs: nutrition.eggs >= goals.eggs,
    seafood: nutrition.seafood_portions >= goals.seafood_portions,
  }
}
