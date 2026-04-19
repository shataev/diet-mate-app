'use client'

import { useEffect, useState } from 'react'
import { Goals } from '@/types'

const FIELDS: { key: keyof Goals; label: string; unit: string; step: number }[] = [
  { key: 'calories', label: 'Калории', unit: 'ккал', step: 50 },
  { key: 'vegetables_g', label: 'Растительность', unit: 'г', step: 50 },
  { key: 'avocado_g', label: 'Авокадо', unit: 'г', step: 10 },
  { key: 'calcium_mg', label: 'Кальций', unit: 'мг', step: 50 },
  { key: 'omega3_g', label: 'Омега-3', unit: 'г', step: 0.5 },
  { key: 'eggs', label: 'Яйца', unit: 'шт', step: 1 },
  { key: 'seafood_portions', label: 'Морепродукты', unit: 'порций', step: 1 },
]

const DEFAULTS: Goals = {
  calories: 2000,
  vegetables_g: 800,
  avocado_g: 150,
  calcium_mg: 1000,
  omega3_g: 2,
  eggs: 3,
  seafood_portions: 3,
}

export default function SettingsPage() {
  const [goals, setGoals] = useState<Goals>(DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/goals')
      .then((r) => r.json())
      .then((data) => {
        setGoals({
          calories: data.calories,
          vegetables_g: data.vegetables_g,
          avocado_g: data.avocado_g,
          calcium_mg: data.calcium_mg,
          omega3_g: data.omega3_g,
          eggs: data.eggs,
          seafood_portions: data.seafood_portions,
        })
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goals),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)' }} className="text-center py-12">Загрузка...</div>
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
        Мои цели
      </h1>

      <div className="flex flex-col gap-3">
        {FIELDS.map(({ key, label, unit, step }) => (
          <div
            key={key}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {label}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {unit}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setGoals((g) => ({ ...g, [key]: Math.max(0, Number(g[key]) - step) }))
                }
                className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center"
                style={{ backgroundColor: 'var(--surface2)', color: 'var(--text)' }}
              >
                −
              </button>
              <input
                type="number"
                value={goals[key]}
                step={step}
                onChange={(e) =>
                  setGoals((g) => ({ ...g, [key]: Number(e.target.value) }))
                }
                className="w-20 text-center text-sm rounded-lg px-2 py-1 outline-none"
                style={{
                  backgroundColor: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              />
              <button
                onClick={() =>
                  setGoals((g) => ({ ...g, [key]: Number(g[key]) + step }))
                }
                className="w-8 h-8 rounded-lg text-lg font-bold flex items-center justify-center"
                style={{ backgroundColor: 'var(--surface2)', color: 'var(--text)' }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
        style={{
          backgroundColor: saved ? 'var(--success)' : 'var(--accent)',
          color: '#fff',
        }}
      >
        {saved ? '✓ Сохранено' : 'Сохранить'}
      </button>
    </div>
  )
}
