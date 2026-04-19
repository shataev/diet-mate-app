import { getFoodDiary, FatsecretDiaryEntry } from './fatsecret'
import { categorizeBatch } from './categorizer'
import { getOmega3Per100g } from './usda'
import { getDb } from './db'
import { DailyNutrition } from '@/types'

const SEAFOOD_PORTION_G = 110
const EGG_WEIGHT_G = 50

export async function getDailyNutrition(date: Date): Promise<DailyNutrition> {
  const entries = await getFoodDiary(date)

  if (entries.length === 0) {
    return { calories: 0, protein_g: 0, vegetables_g: 0, avocado_g: 0, calcium_mg: 0, omega3_g: 0, eggs: 0, seafood_portions: 0 }
  }

  const foodNames = [...new Set(entries.map((e) => e.food_entry_name))]
  const categories = await categorizeBatch(foodNames)

  const result: DailyNutrition = { calories: 0, protein_g: 0, vegetables_g: 0, avocado_g: 0, calcium_mg: 0, omega3_g: 0, eggs: 0, seafood_portions: 0 }

  await Promise.all(entries.map(async (entry) => {
    const grams = getEntryGrams(entry)
    const category = categories.get(entry.food_entry_name) ?? 'other'

    result.calories += Number(entry.calories) || 0
    result.protein_g += Number(entry.protein) || 0
    result.calcium_mg += (Number(entry.calcium) || 0) * (grams / 100)

    if (category === 'vegetables') {
      result.vegetables_g += grams
    } else if (category === 'avocado') {
      result.avocado_g += grams
    } else if (category === 'eggs') {
      result.eggs += Math.round(grams / EGG_WEIGHT_G)
    } else if (category === 'seafood') {
      result.seafood_portions += grams / SEAFOOD_PORTION_G
    }

    if (category === 'omega3') {
      const db = getDb()
      const row = db.prepare('SELECT omega3_per_100g FROM food_cache WHERE food_name = ?')
        .get(entry.food_entry_name.toLowerCase()) as { omega3_per_100g: number | null } | undefined
      if (row?.omega3_per_100g) {
        result.omega3_g += row.omega3_per_100g * (grams / 100)
      }
    } else {
      const omega3Per100g = await getOmega3Per100g(entry.food_entry_name)
      if (omega3Per100g !== null) {
        result.omega3_g += omega3Per100g * (grams / 100)
      }
    }
  }))

  result.seafood_portions = Math.round(result.seafood_portions * 10) / 10
  result.omega3_g = Math.round(result.omega3_g * 100) / 100
  result.calcium_mg = Math.round(result.calcium_mg)
  result.protein_g = Math.round(result.protein_g)

  return result
}

function getEntryGrams(entry: FatsecretDiaryEntry): number {
  const desc = entry.food_entry_description || ''
  const units = parseFloat(entry.number_of_units) || 1

  // Standard food: "254 g Banana" — number_of_units IS grams (1g per unit)
  if (!desc.includes(':custom:')) return units

  // Custom food: extract grams-per-serving from description
  // "(X g)" → e.g. "1 порция (340 g)"
  let m = desc.match(/\((\d+(?:\.\d+)?)\s*g\)/)
  if (m) return units * parseFloat(m[1])

  // ", X g" → e.g. "1 serving, 100 g"
  m = desc.match(/,\s*(\d+(?:\.\d+)?)\s*g/)
  if (m) return units * parseFloat(m[1])

  // ":custom:Xs  g" or ":custom:X g" → e.g. "0.833 :custom:25 g"
  m = desc.match(/:custom:(\d+(?:\.\d+)?)s?\s*g/)
  if (m) return units * parseFloat(m[1])

  // Any "X g" in description as last resort
  m = desc.match(/(\d+(?:\.\d+)?)\s*g/)
  if (m) return units * parseFloat(m[1])

  return units * 100
}
