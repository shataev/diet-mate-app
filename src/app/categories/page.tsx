'use client'

import { useEffect, useState } from 'react'
import { FoodCategory } from '@/types'
import { useLang } from '@/contexts/LanguageContext'

const CATEGORIES: FoodCategory[] = ['vegetables', 'avocado', 'eggs', 'seafood', 'omega3', 'other']

const CATEGORY_LABELS: Record<FoodCategory, Record<string, string>> = {
  vegetables: { en: 'Vegetables & Fruits', ru: 'Растительность' },
  avocado:    { en: 'Avocado', ru: 'Авокадо' },
  eggs:       { en: 'Eggs', ru: 'Яйца' },
  seafood:    { en: 'Seafood', ru: 'Морепродукты' },
  omega3:     { en: 'Omega-3', ru: 'Омега-3' },
  other:      { en: 'Other', ru: 'Другое' },
}

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  vegetables: '#22c55e',
  avocado:    '#84cc16',
  eggs:       '#f59e0b',
  seafood:    '#6366f1',
  omega3:     '#06b6d4',
  other:      '#6b7280',
}

interface CacheEntry {
  food_name: string
  category: FoodCategory
  omega3_per_100g: number | null
}

export default function CategoriesPage() {
  const { lang } = useLang()
  const [items, setItems] = useState<CacheEntry[]>([])
  const [filter, setFilter] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [omega3Editing, setOmega3Editing] = useState<Record<string, string>>({})

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

  const updateOmega3 = async (food_name: string, value: string) => {
    const parsed = value === '' ? null : parseFloat(value)
    if (value !== '' && (isNaN(parsed!) || parsed! < 0)) return
    setSaving(food_name)
    setItems((prev) => prev.map((i) => i.food_name === food_name ? { ...i, omega3_per_100g: parsed } : i))
    await fetch('/api/food-cache', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ food_name, omega3_per_100g: parsed }),
    })
    setSaving(null)
  }

  const filtered = items.filter((i) =>
    i.food_name.toLowerCase().includes(filter.toLowerCase())
  )

  const title = lang === 'ru' ? 'Категории продуктов' : 'Food Categories'
  const searchPlaceholder = lang === 'ru' ? 'Поиск...' : 'Search...'
  const emptyText = lang === 'ru' ? 'Нет продуктов в кэше' : 'No cached foods yet'
  const omega3Label = lang === 'ru' ? 'Омега-3, г/100г' : 'Omega-3, g/100g'

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
              <div className="flex flex-col gap-2">
                <span
                  className="text-sm"
                  style={{ color: saving === item.food_name ? 'var(--text-muted)' : 'var(--text)' }}
                >
                  {item.food_name}
                </span>
                <div className="flex flex-wrap gap-1">
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
                {item.category === 'omega3' && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {omega3Label}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="—"
                      value={omega3Editing[item.food_name] ?? (item.omega3_per_100g?.toString() ?? '')}
                      onChange={(e) =>
                        setOmega3Editing((prev) => ({ ...prev, [item.food_name]: e.target.value }))
                      }
                      onBlur={(e) => {
                        updateOmega3(item.food_name, e.target.value)
                        setOmega3Editing((prev) => { const n = { ...prev }; delete n[item.food_name]; return n })
                      }}
                      className="w-20 text-xs px-2 py-1 rounded-lg outline-none text-center"
                      style={{
                        backgroundColor: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
