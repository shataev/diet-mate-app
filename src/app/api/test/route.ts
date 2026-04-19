import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { buildOAuthParams } from '@/lib/oauth1'

const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api'

export async function GET() {
  const db = getDb()
  const row = db
    .prepare('SELECT access_token, refresh_token FROM fatsecret_tokens WHERE id = 1')
    .get() as { access_token: string; refresh_token: string }

  const userToken = { token: row.access_token, tokenSecret: row.refresh_token }

  const now = new Date()
  const params = buildOAuthParams('POST', FATSECRET_API_URL,
    process.env.FATSECRET_CLIENT_ID!,
    process.env.FATSECRET_CONSUMER_SECRET!,
    userToken,
    { method: 'weights.get_month.v2', year: String(now.getFullYear()), month: String(now.getMonth() + 1), format: 'json' }
  )

  const res = await fetch(FATSECRET_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })

  return NextResponse.json(await res.json())
}
