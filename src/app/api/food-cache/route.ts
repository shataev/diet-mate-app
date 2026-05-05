export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { FoodCategory } from '@/types'

export async function GET() {
  const db = getDb()
  const rows = db
    .prepare('SELECT food_name, category, omega3_per_100g, omega3_per_unit FROM food_cache ORDER BY food_name ASC')
    .all() as { food_name: string; category: FoodCategory; omega3_per_100g: number | null; omega3_per_unit: number | null }[]
  return NextResponse.json(rows)
}

export async function PUT(request: NextRequest) {
  const body: { food_name: string; category?: FoodCategory; omega3_per_100g?: number | null; omega3_per_unit?: number | null } = await request.json()
  const db = getDb()

  if (body.category !== undefined) {
    db.prepare(`UPDATE food_cache SET category = ?, updated_at = datetime('now') WHERE food_name = ?`)
      .run(body.category, body.food_name.toLowerCase())
  }

  if ('omega3_per_100g' in body) {
    db.prepare(`UPDATE food_cache SET omega3_per_100g = ?, updated_at = datetime('now') WHERE food_name = ?`)
      .run(body.omega3_per_100g ?? null, body.food_name.toLowerCase())
  }

  if ('omega3_per_unit' in body) {
    db.prepare(`UPDATE food_cache SET omega3_per_unit = ?, updated_at = datetime('now') WHERE food_name = ?`)
      .run(body.omega3_per_unit ?? null, body.food_name.toLowerCase())
  }

  return NextResponse.json({ ok: true })
}
