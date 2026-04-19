'use client'

import { useEffect, useState, useCallback } from 'react'
import { Goals, DailyNutrition } from '@/types'

interface ProgressBarProps {
  label: string
  current: number
  goal: number
  unit: string
  format?: (v: number) => string
}

function ProgressBar({ label, current, goal, unit, format }: ProgressBarProps) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0
  const done = current >= goal
  const fmt = format ?? ((v: number) => String(Math.round(v)))

  return (
    <div
      className="px-4 py-3 rounded-xl"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        <span className="text-sm" style={{ color: done ? 'var(--success)' : 'var(--text-muted)' }}>
          {fmt(current)} / {fmt(goal)} {unit}
          {done && ' ✓'}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface2)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: done ? 'var(--success)' : pct > 60 ? 'var(--warning)' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)

  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null)
  const [goals, setGoals] = useState<Goals | null>(null)
  const [weight, setWeight] = useState('')
  const [steps, setSteps] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [goalsRes, logRes] = await Promise.all([
      fetch('/api/goals').then((r) => r.json()),
      fetch(`/api/daily-log?date=${today}`).then((r) => r.json()),
    ])
    setGoals(goalsRes)
    if (logRes.weight_kg) setWeight(String(logRes.weight_kg))
    if (logRes.steps) setSteps(String(logRes.steps))
  }, [today])

  const loadNutrition = useCallback(async () => {
    setRefreshing(true)
    const data = await fetch(`/api/nutrition?date=${today}`).then((r) => r.json())
    setNutrition(data)
    setRefreshing(false)
    setLoading(false)
  }, [today])

  useEffect(() => {
    load()
    loadNutrition()
  }, [load, loadNutrition])

  const saveLog = async () => {
    setSaving(true)
    await fetch('/api/daily-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        weight_kg: weight ? parseFloat(weight) : null,
        steps: steps ? parseInt(steps) : null,
      }),
    })
    setSaving(false)
  }

  if (loading || !goals) {
    return (
      <div style={{ color: 'var(--text-muted)' }} className="text-center py-12">
        Загружаем данные из Fatsecret...
      </div>
    )
  }

  const n = nutrition ?? {
    calories: 0, vegetables_g: 0, avocado_g: 0,
    calcium_mg: 0, omega3_g: 0, eggs: 0, seafood_portions: 0,
  }

  const dateLabel = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', weekday: 'long',
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold capitalize" style={{ color: 'var(--text)' }}>
          {dateLabel}
        </h1>
        <button
          onClick={loadNutrition}
          disabled={refreshing}
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            color: refreshing ? 'var(--text-muted)' : 'var(--text)',
          }}
        >
          {refreshing ? '...' : '↻ Обновить'}
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-3 mb-4 p-4 rounded-xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
            Вес, кг
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="—"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={saveLog}
            className="w-full text-sm px-3 py-2 rounded-lg outline-none"
            style={{
              backgroundColor: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
            Шаги
          </label>
          <input
            type="number"
            placeholder="—"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            onBlur={saveLog}
            className="w-full text-sm px-3 py-2 rounded-lg outline-none"
            style={{
              backgroundColor: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
        </div>
        {saving && (
          <div className="col-span-2 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
            Сохраняется...
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <ProgressBar label="Калории" current={n.calories} goal={goals.calories} unit="ккал" />
        <ProgressBar label="Растительность" current={n.vegetables_g} goal={goals.vegetables_g} unit="г" />
        <ProgressBar label="Авокадо" current={n.avocado_g} goal={goals.avocado_g} unit="г" />
        <ProgressBar label="Кальций" current={n.calcium_mg} goal={goals.calcium_mg} unit="мг" />
        <ProgressBar
          label="Омега-3"
          current={n.omega3_g}
          goal={goals.omega3_g}
          unit="г"
          format={(v) => v.toFixed(1)}
        />
        <ProgressBar label="Яйца" current={n.eggs} goal={goals.eggs} unit="шт" />
        <ProgressBar
          label="Морепродукты"
          current={n.seafood_portions}
          goal={goals.seafood_portions}
          unit="порц."
          format={(v) => v.toFixed(1)}
        />
      </div>
    </div>
  )
}
