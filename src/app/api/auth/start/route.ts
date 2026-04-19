import { NextRequest, NextResponse } from 'next/server'
import { getRequestToken } from '@/lib/oauth1'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const origin = new URL(request.url).origin
    const callbackUrl = `${origin}/api/auth/callback`
    const requestToken = await getRequestToken(
      process.env.FATSECRET_CLIENT_ID!,
      process.env.FATSECRET_CONSUMER_SECRET!,
      callbackUrl
    )

    const db = getDb()
    db.prepare(`
      INSERT OR REPLACE INTO fatsecret_tokens (id, access_token, refresh_token, expires_at)
      VALUES (1, '', ?, 0)
    `).run(requestToken.tokenSecret)

    return NextResponse.redirect(
      `https://authentication.fatsecret.com/oauth/authorize?oauth_token=${requestToken.token}`
    )
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
