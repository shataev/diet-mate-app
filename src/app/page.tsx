'use client'

import { useEffect, useState, useCallback } from 'react'
import { Goals, DailyNutrition } from '@/types'
import { useLang } from '@/contexts/LanguageContext'

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
          {fmt(current)} / {fmt(goal)} {unit}{done && ' ✓'}
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

interface WeightPoint {
  date: string
  weight_kg: number | null
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Dashboard() {
  const { t, lang } = useLang()
  const today = new Date().toISOString().slice(0, 10)

  const [selectedDate, setSelectedDate] = useState(today)
  const [nutrition, setNutrition] = useState<DailyNutrition | null>(null)
  const [weeklyTotals, setWeeklyTotals] = useState<{ omega3_g: number; eggs: number; seafood_portions: number } | null>(null)
  const [goals, setGoals] = useState<Goals | null>(null)
  const [weightHistory, setWeightHistory] = useState<WeightPoint[]>([])
  const [steps, setSteps] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [goalsRes, logRes, historyRes] = await Promise.all([
      fetch('/api/goals').then((r) => r.json()),
      fetch(`/api/daily-log?date=${selectedDate}`).then((r) => r.json()),
      fetch(`/api/weight-history?date=${selectedDate}`).then((r) => r.json()),
    ])
    setGoals(goalsRes)
    setSteps(logRes.steps ?? 0)
    setWeightHistory(historyRes)
  }, [selectedDate])

  const loadNutrition = useCallback(async () => {
    setRefreshing(true)
    const [dailyData, weeklyData] = await Promise.all([
      fetch(`/api/nutrition?date=${selectedDate}`).then((r) => r.json()),
      fetch(`/api/weekly?date=${selectedDate}`).then((r) => r.json()),
    ])
    setNutrition(dailyData)
    const days: { nutrition: DailyNutrition }[] = weeklyData.days ?? []
    setWeeklyTotals({
      omega3_g: days.reduce((s, d) => s + (d.nutrition.omega3_g ?? 0), 0),
      eggs: days.reduce((s, d) => s + (d.nutrition.eggs ?? 0), 0),
      seafood_portions: days.reduce((s, d) => s + (d.nutrition.seafood_portions ?? 0), 0),
    })
    setRefreshing(false)
    setLoading(false)
  }, [selectedDate])

  useEffect(() => {
    setNutrition(null)
    setWeeklyTotals(null)
    setSteps(0)
    load()
    loadNutrition()
  }, [load, loadNutrition])

  if (loading || !goals) {
    return (
      <div style={{ color: 'var(--text-muted)' }} className="text-center py-12">
        {t.dashboard.loading}
      </div>
    )
  }

  const n = nutrition ?? {
    calories: 0, vegetables_g: 0, avocado_g: 0,
    calcium_mg: 0, omega3_g: 0, eggs: 0, seafood_portions: 0,
  }

  const isToday = selectedDate === today
  const dateLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString(
    lang === 'ru' ? 'ru-RU' : 'en-US',
    { day: 'numeric', month: 'long', weekday: 'long' }
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            ‹
          </button>
          <h1 className="text-base font-semibold capitalize" style={{ color: 'var(--text)' }}>
            {dateLabel}
          </h1>
          <button
            onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
            disabled={isToday}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              color: isToday ? 'var(--text-muted)' : 'var(--text)',
              opacity: isToday ? 0.4 : 1,
            }}
          >
            ›
          </button>
        </div>
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
          {refreshing ? t.dashboard.refreshing : `↻ ${t.dashboard.refresh}`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="px-4 py-3 rounded-xl flex flex-col gap-1"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {t.dashboard.weight}
          </span>
          <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {weightHistory.find((d) => d.date === selectedDate)?.weight_kg?.toFixed(1) ?? '—'}
          </span>
        </div>

        <div
          className="px-4 py-3 rounded-xl flex flex-col gap-1"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {t.dashboard.steps}
          </span>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span
              className="text-2xl font-bold"
              style={{ color: steps >= goals.steps_goal ? 'var(--success)' : 'var(--text)' }}
            >
              {steps > 0 ? steps.toLocaleString() : '—'}
            </span>
            {goals.steps_goal > 0 && steps > 0 && (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                of {goals.steps_goal.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
          {t.weekly.daily}
        </div>
        <ProgressBar label={t.params.calories} current={n.calories} goal={goals.calories} unit={t.units.kcal} />
        <ProgressBar label={t.params.vegetables} current={n.vegetables_g} goal={goals.vegetables_g} unit={t.units.g} />
        <ProgressBar label={t.params.avocado} current={n.avocado_g} goal={goals.avocado_g} unit={t.units.g} />
        <ProgressBar label={t.params.calcium} current={n.calcium_mg} goal={goals.calcium_mg} unit={t.units.mg} />

        <div className="text-xs font-semibold uppercase tracking-wider mt-2" style={{ color: 'var(--text-muted)' }}>
          {t.weekly.weekly}
        </div>
        <ProgressBar
          label={t.params.omega3}
          current={weeklyTotals?.omega3_g ?? 0}
          goal={goals.omega3_g}
          unit={t.units.g}
          format={(v) => v.toFixed(1)}
        />
        <ProgressBar
          label={t.params.eggs}
          current={weeklyTotals?.eggs ?? 0}
          goal={goals.eggs}
          unit={t.units.pcs}
        />
        <ProgressBar
          label={t.params.seafood}
          current={weeklyTotals?.seafood_portions ?? 0}
          goal={goals.seafood_portions}
          unit={t.units.srv}
          format={(v) => v.toFixed(1)}
        />
      </div>
    </div>
  )
}
