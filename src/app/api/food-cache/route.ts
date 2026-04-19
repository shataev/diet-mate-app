import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { FoodCategory } from '@/types'

export async function GET() {
  const db = getDb()
  const rows = db
    .prepare('SELECT food_name, category FROM food_cache ORDER BY food_name ASC')
    .all() as { food_name: string; category: FoodCategory }[]
  return NextResponse.json(rows)
}

export async function PUT(request: NextRequest) {
  const { food_name, category }: { food_name: string; category: FoodCategory } = await request.json()
  const db = getDb()
  db.prepare(`
    UPDATE food_cache SET category = ?, updated_at = datetime('now') WHERE food_name = ?
  `).run(category, food_name.toLowerCase())
  return NextResponse.json({ ok: true })
}
