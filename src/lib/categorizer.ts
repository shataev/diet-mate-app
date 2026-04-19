import OpenAI from 'openai'
import { getDb } from './db'
import { FoodCategory } from '@/types'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const CATEGORIES: FoodCategory[] = ['vegetables', 'avocado', 'eggs', 'seafood', 'other']

export async function categorizeFood(foodName: string): Promise<FoodCategory> {
  const db = getDb()

  const cached = db
    .prepare('SELECT category FROM food_cache WHERE food_name = ?')
    .get(foodName.toLowerCase()) as { category: FoodCategory } | undefined

  if (cached) return cached.category

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Classify the food item into exactly one category. Reply with only the category name, nothing else.
Categories:
- vegetables: any vegetables, fruits, greens, herbs (tomato, apple, banana, spinach, parsley, carrot, etc.)
- avocado: avocado and guacamole only
- eggs: ONLY whole eggs or simple egg dishes where egg IS the dish (boiled egg, fried egg, scrambled eggs, omelette). NOT pastries, cakes, or dishes that merely contain egg as an ingredient (egg tart, egg roll, quiche, etc.)
- seafood: shellfish and mollusks ONLY — shrimp, mussels, clams, oysters, squid, octopus, crab, lobster, scallops, seafood mix. NOT fish of any kind.
- other: everything else including ALL fish (salmon, tuna, cod, mackerel, herring, sardines, trout, etc.), meat, dairy, grains, nuts, oils, sauces, sweets, pastries, processed foods, etc.`,
      },
      {
        role: 'user',
        content: foodName,
      },
    ],
    max_tokens: 10,
    temperature: 0,
  })

  const raw = response.choices[0].message.content?.trim().toLowerCase() ?? 'other'
  const category: FoodCategory = CATEGORIES.includes(raw as FoodCategory)
    ? (raw as FoodCategory)
    : 'other'

  db.prepare(`
    INSERT OR REPLACE INTO food_cache (food_name, category, updated_at)
    VALUES (?, ?, datetime('now'))
  `).run(foodName.toLowerCase(), category)

  return category
}

export async function categorizeBatch(
  foodNames: string[]
): Promise<Map<string, FoodCategory>> {
  const result = new Map<string, FoodCategory>()
  const db = getDb()

  const uncached: string[] = []
  for (const name of foodNames) {
    const cached = db
      .prepare('SELECT category FROM food_cache WHERE food_name = ?')
      .get(name.toLowerCase()) as { category: FoodCategory } | undefined
    if (cached) {
      result.set(name, cached.category)
    } else {
      uncached.push(name)
    }
  }

  if (uncached.length === 0) return result

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Classify each food item into exactly one category. Reply with JSON object where keys are food names and values are categories.
Categories: vegetables, avocado, eggs, seafood, other
- vegetables: any vegetables, fruits, greens, herbs (tomato, apple, banana, spinach, etc.)
- avocado: avocado and guacamole only
- eggs: ONLY whole eggs or simple egg dishes where egg IS the dish (boiled egg, fried egg, scrambled eggs, omelette). NOT pastries, cakes, or dishes that merely contain egg as ingredient (egg tart, egg roll, quiche, etc.)
- seafood: shellfish and mollusks ONLY — shrimp, mussels, clams, oysters, squid, octopus, crab, lobster, scallops, seafood mix. NOT fish of any kind.
- other: everything else including ALL fish (salmon, tuna, cod, mackerel, herring, sardines, trout, etc.), meat, dairy, grains, nuts, oils, sauces, sweets, pastries, processed foods, etc.`,
      },
      {
        role: 'user',
        content: JSON.stringify(uncached),
      },
    ],
    max_tokens: 500,
    temperature: 0,
    response_format: { type: 'json_object' },
  })

  try {
    const parsed = JSON.parse(response.choices[0].message.content ?? '{}')
    const insert = db.prepare(`
      INSERT OR REPLACE INTO food_cache (food_name, category, updated_at)
      VALUES (?, ?, datetime('now'))
    `)

    for (const name of uncached) {
      const raw = (parsed[name] ?? 'other').toLowerCase()
      const category: FoodCategory = CATEGORIES.includes(raw as FoodCategory)
        ? (raw as FoodCategory)
        : 'other'
      result.set(name, category)
      insert.run(name.toLowerCase(), category)
    }
  } catch {
    for (const name of uncached) {
      result.set(name, 'other')
    }
  }

  return result
}
