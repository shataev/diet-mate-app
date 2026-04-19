import crypto from 'crypto'

export interface OAuth1Tokens {
  token: string
  tokenSecret: string
}

function encode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

function buildBaseString(method: string, url: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${encode(k)}=${encode(params[k])}`)
    .join('&')
  return [method.toUpperCase(), encode(url), encode(sorted)].join('&')
}

function sign(baseString: string, consumerSecret: string, tokenSecret = ''): string {
  const key = `${encode(consumerSecret)}&${encode(tokenSecret)}`
  return crypto.createHmac('sha1', key).update(baseString).digest('base64')
}

export function buildOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  userToken?: OAuth1Tokens,
  extraParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
    ...extraParams,
  }

  if (userToken) {
    oauthParams.oauth_token = userToken.token
  }

  const allParams = { ...oauthParams, ...extraParams }
  const base = buildBaseString(method, url, allParams)
  oauthParams.oauth_signature = sign(base, consumerSecret, userToken?.tokenSecret)

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${encode(k)}="${encode(oauthParams[k])}"`)
    .join(', ')

  return `OAuth ${header}`
}

export function buildOAuthParams(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  userToken?: OAuth1Tokens,
  extraParams: Record<string, string> = {}
): Record<string, string> {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
    ...extraParams,
  }

  if (userToken) {
    oauthParams.oauth_token = userToken.token
  }

  const allParams = { ...oauthParams }
  const base = buildBaseString(method, url, allParams)
  oauthParams.oauth_signature = sign(base, consumerSecret, userToken?.tokenSecret)

  return oauthParams
}

export async function getRequestToken(
  consumerKey: string,
  consumerSecret: string,
  callbackUrl: string
): Promise<OAuth1Tokens> {
  const url = 'https://authentication.fatsecret.com/oauth/request_token'
  const params = buildOAuthParams('POST', url, consumerKey, consumerSecret, undefined, {
    oauth_callback: callbackUrl,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Request token failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const body = await res.text()
  const parsed = Object.fromEntries(new URLSearchParams(body))
  return { token: parsed.oauth_token, tokenSecret: parsed.oauth_token_secret }
}

export async function getAccessToken(
  consumerKey: string,
  consumerSecret: string,
  requestToken: OAuth1Tokens,
  verifier: string
): Promise<OAuth1Tokens> {
  const url = 'https://authentication.fatsecret.com/oauth/access_token'
  const params = buildOAuthParams('GET', url, consumerKey, consumerSecret, requestToken, {
    oauth_verifier: verifier,
  })

  const res = await fetch(`${url}?${new URLSearchParams(params)}`, {
    method: 'GET',
  })

  if (!res.ok) throw new Error(`Access token failed (${res.status}): ${await res.text()}`)

  const body = await res.text()
  const parsed = Object.fromEntries(new URLSearchParams(body))
  return { token: parsed.oauth_token, tokenSecret: parsed.oauth_token_secret }
}
