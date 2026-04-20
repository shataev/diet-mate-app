import { getDb } from './db'
import { buildOAuthParams, OAuth1Tokens } from './oauth1'

const FATSECRET_API_URL = 'https://platform.fatsecret.com/rest/server.api'

export interface FatsecretDiaryEntry {
  food_entry_id: string
  food_id: string
  food_entry_name: string
  food_entry_description: string
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

let authError = false

export function hasAuthError(): boolean { return authError }
export function clearAuthError(): void { authError = false }

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

  if (res.status === 401 || res.status === 403) {
    authError = true
    throw new Error(`Fatsecret API error: ${res.statusText}`)
  }
  if (!res.ok) throw new Error(`Fatsecret API error: ${res.statusText}`)
  authError = false
  return res.json()
}

export async function getWeightForDate(date: Date): Promise<number | null> {
  const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24))

  const data = await callApi('weights.get_month.v2', {
    year: String(date.getFullYear()),
    month: String(date.getMonth() + 1),
  }) as { month?: { day?: { date_int: string; weight_kg: string } | { date_int: string; weight_kg: string }[] } }

  const days = data.month?.day
  if (!days) return null

  const arr = Array.isArray(days) ? days : [days]
  const entry = arr.find((d) => d.date_int === String(daysSinceEpoch))
  return entry ? parseFloat(entry.weight_kg) : null
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
