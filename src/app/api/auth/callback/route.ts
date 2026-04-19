import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/oauth1'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const oauthToken = searchParams.get('oauth_token')
  const oauthVerifier = searchParams.get('oauth_verifier')

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.json({ error: 'Missing oauth params' }, { status: 400 })
  }

  const db = getDb()
  const row = db
    .prepare('SELECT refresh_token FROM fatsecret_tokens WHERE id = 1')
    .get() as { refresh_token: string } | undefined

  if (!row?.refresh_token) {
    return NextResponse.json({ error: 'No request token secret stored' }, { status: 400 })
  }

  try {
    const accessToken = await getAccessToken(
      process.env.FATSECRET_CLIENT_ID!,
      process.env.FATSECRET_CONSUMER_SECRET!,
      { token: oauthToken, tokenSecret: row.refresh_token },
      oauthVerifier
    )

    db.prepare(`
      UPDATE fatsecret_tokens
      SET access_token = ?, refresh_token = ?, expires_at = 9999999999999, updated_at = datetime('now')
      WHERE id = 1
    `).run(accessToken.token, accessToken.tokenSecret)

    return NextResponse.redirect(new URL('/', request.url))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
