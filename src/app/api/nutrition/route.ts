export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDailyNutrition } from '@/lib/nutrition'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
  const date = new Date(dateStr + 'T12:00:00')

  try {
    const nutrition = await getDailyNutrition(date)
    return NextResponse.json(nutrition)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
