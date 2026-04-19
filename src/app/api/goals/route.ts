export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Goals } from '@/types'

export async function GET() {
  const db = getDb()
  const goals = db.prepare('SELECT * FROM goals WHERE id = 1').get() as Goals & { id: number; updated_at: string }
  return NextResponse.json(goals)
}

export async function PUT(request: NextRequest) {
  const body: Goals = await request.json()
  const db = getDb()

  db.prepare(`
    UPDATE goals SET
      calories = ?,
      vegetables_g = ?,
      avocado_g = ?,
      calcium_mg = ?,
      omega3_g = ?,
      eggs = ?,
      seafood_portions = ?,
      steps_goal = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    body.calories,
    body.vegetables_g,
    body.avocado_g,
    body.calcium_mg,
    body.omega3_g,
    body.eggs,
    body.seafood_portions,
    body.steps_goal
  )

  return NextResponse.json({ ok: true })
}
