import { getDb } from './db'
import { buildOAuthParams, OAuth1Tokens } from './oauth1'

const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api'

export interface FatsecretDiaryEntry {
  food_entry_id: string
  food_id: string
  food_entry_name: string
  number_of_units: string
  meal: string
  calories: string
  carbohydrate: string
  protein: string
  fat: string
  calcium?: string
  metric_serving_amount?: string
  metric_serving_unit?: string
}

function getUserTokens(): OAuth1Tokens {
  const db = getDb()
  const row = db
    .prepare('SELECT access_token, refresh_token FROM fatsecret_tokens WHERE id = 1')
    .get() as { access_token: string; refresh_token: string } | undefined

  if (!row?.access_token) throw new Error('NOT_AUTHORIZED')
  return { token: row.access_token, tokenSecret: row.refresh_token }
}

export function isAuthorized(): boolean {
  try {
    getUserTokens()
    return true
  } catch {
    return false
  }
}

async function callApi(method: string, extraParams: Record<string, string>): Promise<unknown> {
  const userTokens = getUserTokens()
  const allParams = buildOAuthParams(
    'POST',
    FATSECRET_API_URL,
    process.env.FATSECRET_CLIENT_ID!,
    process.env.FATSECRET_CONSUMER_SECRET!,
    userTokens,
    { method, format: 'json', ...extraParams }
  )

  const res = await fetch(FATSECRET_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(allParams),
  })

  if (!res.ok) throw new Error(`Fatsecret API error: ${res.statusText}`)
  return res.json()
}

export async function getFoodDiary(date: Date): Promise<FatsecretDiaryEntry[]> {
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24))

  const data = await callApi('food_entries.get.v2', { date: String(daysSinceEpoch) }) as {
    food_entries?: { food_entry?: FatsecretDiaryEntry | FatsecretDiaryEntry[] }
  }

  const entries = data.food_entries?.food_entry
  if (!entries) return []
  return Array.isArray(entries) ? entries : [entries]
}
