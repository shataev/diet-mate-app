export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { Profile } from '@/types'

export async function GET() {
  const db = getDb()
  const profile = db.prepare('SELECT gender, height_cm FROM profile WHERE id = 1').get() as Profile
  return NextResponse.json(profile)
}

export async function PUT(request: NextRequest) {
  const body: Profile = await request.json()
  const db = getDb()

  db.prepare(`
    UPDATE profile SET
      gender = ?,
      height_cm = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(body.gender ?? null, body.height_cm ?? null)

  return NextResponse.json({ ok: true })
}
