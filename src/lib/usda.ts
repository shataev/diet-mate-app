import { getDb } from './db'

const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1'
const API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY'

// Omega-3 nutrient IDs in USDA FoodData Central
const OMEGA3_NUTRIENT_IDS = [
  1404, // 18:3 n-3 c,c,c (ALA)
  1405, // 20:5 n-3 (EPA)
  1406, // 22:5 n-3 (DPA)
  1032, // 22:6 n-3 (DHA)
]

export async function getOmega3Per100g(foodName: string): Promise<number | null> {
  const db = getDb()

  const cached = db
    .prepare('SELECT omega3_per_100g FROM food_cache WHERE food_name = ?')
    .get(foodName.toLowerCase()) as { omega3_per_100g: number | null } | undefined

  if (cached !== undefined) return cached.omega3_per_100g ?? null

  try {
    const searchRes = await fetch(
      `${USDA_API_URL}/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&api_key=${API_KEY}`
    )

    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const food = searchData.foods?.[0]
    if (!food) return null

    let omega3Total = 0
    for (const nutrient of food.foodNutrients ?? []) {
      if (OMEGA3_NUTRIENT_IDS.includes(nutrient.nutrientId)) {
        omega3Total += nutrient.value ?? 0
      }
    }

    const omega3 = omega3Total > 0 ? omega3Total : null

    db.prepare(`
      UPDATE food_cache SET omega3_per_100g = ? WHERE food_name = ?
    `).run(omega3, foodName.toLowerCase())

    return omega3
  } catch {
    return null
  }
}
