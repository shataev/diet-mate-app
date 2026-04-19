import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getDailyNutrition } from '@/lib/nutrition'
import { getWeightForDate } from '@/lib/fatsecret'
import { getStepsForDate } from '@/lib/garmin'
import { Goals, DailyNutrition } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endDateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const endDate = new Date(endDateStr + 'T12:00:00')

  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
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

      const [nutrition, fsWeight, garminSteps] = await Promise.all([
        getDailyNutrition(date),
        weight_kg === null ? getWeightForDate(date).catch(() => null) : Promise.resolve(null),
        steps === null ? getStepsForDate(date).catch(() => null) : Promise.resolve(null),
      ])

      if (fsWeight !== null) weight_kg = fsWeight
      if (garminSteps !== null) steps = garminSteps

      if (fsWeight !== null || garminSteps !== null) {
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
    vegetables: nutrition.vegetables_g >= goals.vegetables_g,
    avocado: nutrition.avocado_g >= goals.avocado_g,
    calcium: nutrition.calcium_mg >= goals.calcium_mg,
    omega3: nutrition.omega3_g >= goals.omega3_g,
    eggs: nutrition.eggs >= goals.eggs,
    seafood: nutrition.seafood_portions >= goals.seafood_portions,
  }
}
