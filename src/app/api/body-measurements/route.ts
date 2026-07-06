export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { calculateBodyFatPercent } from '@/lib/bodyfat'
import { Gender, Profile } from '@/types'

interface MeasurementRow {
  date: string
  neck_cm: number | null
  waist_cm: number | null
  hip_cm: number | null
}

export async function GET() {
  const db = getDb()
  const profile = db.prepare('SELECT gender, height_cm FROM profile WHERE id = 1').get() as Profile
  const rows = db
    .prepare('SELECT date, neck_cm, waist_cm, hip_cm FROM body_measurements ORDER BY date ASC')
    .all() as MeasurementRow[]

  const measurements = rows.map((r) => ({
    ...r,
    body_fat_pct: calculateBodyFatPercent({
      gender: profile.gender as Gender | null,
      height_cm: profile.height_cm,
      neck_cm: r.neck_cm,
      waist_cm: r.waist_cm,
      hip_cm: r.hip_cm,
    }),
  }))

  return NextResponse.json({ profile, measurements })
}

export async function PATCH(request: NextRequest) {
  const { date, neck_cm, waist_cm, hip_cm } = await request.json()
  const db = getDb()

  db.prepare(`
    INSERT INTO body_measurements (date, neck_cm, waist_cm, hip_cm)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      neck_cm = COALESCE(excluded.neck_cm, neck_cm),
      waist_cm = COALESCE(excluded.waist_cm, waist_cm),
      hip_cm = COALESCE(excluded.hip_cm, hip_cm),
      updated_at = datetime('now')
  `).run(date, neck_cm ?? null, waist_cm ?? null, hip_cm ?? null)

  return NextResponse.json({ ok: true })
}
