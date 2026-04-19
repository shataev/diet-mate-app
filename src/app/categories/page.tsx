'use client'

import { useEffect, useState } from 'react'
import { FoodCategory } from '@/types'
import { useLang } from '@/contexts/LanguageContext'

const CATEGORIES: FoodCategory[] = ['vegetables', 'avocado', 'eggs', 'seafood', 'other']

const CATEGORY_LABELS: Record<FoodCategory, Record<string, string>> = {
  vegetables: { en: 'Vegetables & Fruits', ru: 'Растительность' },
  avocado:    { en: 'Avocado', ru: 'Авокадо' },
  eggs:       { en: 'Eggs', ru: 'Яйца' },
  seafood:    { en: 'Seafood', ru: 'Морепродукты' },
  other:      { en: 'Other', ru: 'Другое' },
}

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  vegetables: '#22c55e',
  avocado:    '#84cc16',
  eggs:       '#f59e0b',
  seafood:    '#6366f1',
  other:      '#6b7280',
}

interface CacheEntry {
  food_name: string
  category: FoodCategory
}

export default function CategoriesPage() {
  const { lang } = useLang()
  const [items, setItems] = useState<CacheEntry[]>([])
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/food-cache')
      .then((r) => r.json())
      .then(setItems)
  }, [])

  const updateCategory = async (food_name: string, category: FoodCategory) => {
    setSaving(food_name)
    setItems((prev) => prev.map((i) => i.food_name === food_name ? { ...i, category } : i))
    await fetch('/api/food-cache', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_name, category }),
    })
    setSaving(null)
  }

  const filtered = items.filter((i) =>
    i.food_name.toLowerCase().includes(filter.toLowerCase())
  )

  const title = lang === 'ru' ? 'Категории продуктов' : 'Food Categories'
  const searchPlaceholder = lang === 'ru' ? 'Поиск...' : 'Search...'
  const emptyText = lang === 'ru' ? 'Нет продуктов в кэше' : 'No cached foods yet'

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
        {title}
      </h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        {lang === 'ru'
          ? 'Исправьте категорию если AI ошибся. Изменения применяются сразу.'
          : 'Fix the category if AI got it wrong. Changes apply immediately.'}
      </p>

      <input
        type="text"
        placeholder={searchPlaceholder}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg outline-none mb-4"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          {emptyText}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <div
              key={item.food_name}
              className="px-4 py-3 rounded-xl"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-sm flex-1 truncate"
                  style={{ color: saving === item.food_name ? 'var(--text-muted)' : 'var(--text)' }}
                >
                  {item.food_name}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => updateCategory(item.food_name, cat)}
                      title={CATEGORY_LABELS[cat][lang] ?? CATEGORY_LABELS[cat].en}
                      className="text-xs px-2 py-1 rounded-lg transition-opacity"
                      style={{
                        backgroundColor: item.category === cat ? CATEGORY_COLORS[cat] : 'var(--surface2)',
                        color: item.category === cat ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${item.category === cat ? CATEGORY_COLORS[cat] : 'var(--border)'}`,
                        fontWeight: item.category === cat ? 600 : 400,
                      }}
                    >
                      {CATEGORY_LABELS[cat][lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
