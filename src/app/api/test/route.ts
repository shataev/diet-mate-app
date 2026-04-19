import { NextResponse } from 'next/server'
import { getFoodDiary } from '@/lib/fatsecret'

export async function GET() {
  const entries = await getFoodDiary(new Date())
  return NextResponse.json(entries.slice(0, 10))
}
