'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { DailyNutrition, Goals } from '@/types'

interface DayResult {
  date: string
  weight_kg: number | null
  steps: number | null
  nutrition: DailyNutrition
  hits: Record<string, boolean>
}

interface WeeklyData {
  days: DayResult[]
  goals: Goals
  avgSteps: number
}

function TrendChart({
  days,
  getValue,
  goal,
  color,
  type = 'bar',
  lang,
}: {
  days: DayResult[]
  getValue: (d: DayResult) => number | null
  goal?: number
  color: string
  type?: 'bar' | 'line'
  lang: string
}) {
  const W = 300, H = 80, PAD = 4, BOTTOM = 18
  const vals = days.map(getValue)
  const defined = vals.filter((v) => v !== null) as number[]
  if (defined.length === 0) return <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>—</div>

  const min = type === 'line' ? Math.min(...defined) * 0.98 : 0
  const max = Math.max(...defined, goal ?? 0) * 1.05 || 1
  const range = max - min || 1

  const xStep = (W - PAD * 2) / (days.length - 1)
  const yScale = (v: number) => H - BOTTOM - ((v - min) / range) * (H - BOTTOM - PAD)

  const barW = (W - PAD * 2) / days.length * 0.6
  const barX = (i: number) => PAD + i * ((W - PAD * 2) / days.length) + ((W - PAD * 2) / days.length) * 0.2

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'narrow' })
  }

  const goalY = goal !== undefined ? yScale(goal) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {goalY !== null && (
        <line x1={PAD} y1={goalY} x2={W - PAD} y2={goalY}
          stroke="rgba(180,180,180,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
      )}
      {type === 'bar' && days.map((d, i) => {
        const v = getValue(d)
        if (v === null) return null
        const barH = Math.max(2, ((v - min) / range) * (H - BOTTOM - PAD))
        const hit = goal !== undefined ? v >= goal : true
        return (
          <g key={d.date}>
            <rect x={barX(i)} y={H - BOTTOM - barH} width={barW} height={barH}
              fill={hit ? color : 'var(--danger)'} rx="2" opacity="0.85" />
          </g>
        )
      })}
      {type === 'line' && (() => {
        const points = days.map((d, i) => {
          const v = getValue(d)
          return v !== null ? `${PAD + i * xStep},${yScale(v)}` : null
        })
        const path = points.reduce<string>((acc, p, i) => {
          if (!p) return acc
          const prev = points.slice(0, i).reverse().find(Boolean)
          return acc + (prev ? `L${p}` : `M${p}`)
        }, '')
        return (
          <>
            <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {days.map((d, i) => {
              const v = getValue(d)
              if (v === null) return null
              return <circle key={d.date} cx={PAD + i * xStep} cy={yScale(v)} r="3" fill={color} />
            })}
          </>
        )
      })()}
      {days.map((d, i) => {
        const cx = type === 'bar' ? barX(i) + barW / 2 : PAD + i * xStep
        return (
          <text key={d.date} x={cx} y={H - 4} textAnchor="middle"
            fontSize="9" fill="var(--text-muted)">
            {dayLabel(d.date)}
          </text>
        )
      })}
    </svg>
  )
}

function shortDay(dateStr: string, lang: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' })
}

function dayScore(hits: Record<string, boolean>, dailyKeys: string[]) {
  return dailyKeys.filter((k) => hits[k]).length
}

function dayColor(score: number, total: number) {
  const ratio = score / total
  if (ratio >= 1) return 'var(--success)'
  if (ratio >= 0.6) return '#f59e0b'
  return 'var(--danger)'
}

export default function WeeklyPage() {
  const { t, lang } = useLang()
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)

  const DAILY_PARAMS: { key: string; label: string; unit: string; getValue: (n: DailyNutrition) => string | number }[] = [
    { key: 'calories', label: t.params.calories, unit: t.units.kcal, getValue: (n) => n.calories },
    { key: 'protein', label: t.params.protein, unit: t.units.g, getValue: (n) => n.protein_g },
    { key: 'vegetables', label: t.params.vegetables, unit: t.units.g, getValue: (n) => Math.round(n.vegetables_g) },
    { key: 'avocado', label: t.params.avocado, unit: t.units.g, getValue: (n) => Math.round(n.avocado_g) },
    { key: 'calcium', label: t.params.calcium, unit: t.units.mg, getValue: (n) => n.calcium_mg },
  ]

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/weekly?date=${today}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  if (loading || !data) {
    return (
      <div style={{ color: 'var(--text-muted)' }} className="text-center py-12">
        {t.weekly.loading}
      </div>
    )
  }

  const { days, goals } = data
  const daysWithWeight = days.filter((d) => d.weight_kg !== null)

  const weeklyOmega3 = days.reduce((s, d) => s + d.nutrition.omega3_g, 0)
  const weeklyEggs = days.reduce((s, d) => s + d.nutrition.eggs, 0)
  const weeklySeafood = days.reduce((s, d) => s + d.nutrition.seafood_portions, 0)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
        {t.weekly.title}
      </h1>

      {/* Weight + Steps */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t.weekly.weightLatest}</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {daysWithWeight.length > 0 ? `${daysWithWeight[daysWithWeight.length - 1].weight_kg}` : '—'}
          </div>
          {daysWithWeight.length >= 2 && (() => {
            const diff = (daysWithWeight[daysWithWeight.length - 1].weight_kg ?? 0) - (daysWithWeight[0].weight_kg ?? 0)
            return (
              <div className="text-xs mt-1" style={{ color: diff < 0 ? 'var(--success)' : diff > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {t.weekly.weekDelta(`${diff > 0 ? '+' : ''}${diff.toFixed(1)}`)}
              </div>
            )
          })()}
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t.weekly.avgSteps}</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {data.avgSteps > 0 ? data.avgSteps.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US') : '—'}
          </div>
        </div>
      </div>

      {/* Trend charts */}
      {[
        {
          label: t.weekly.weightLatest,
          unit: 'kg',
          getValue: (d: DayResult) => d.weight_kg,
          color: 'var(--accent)',
          type: 'line' as const,
        },
        {
          label: t.params.calories,
          unit: t.units.kcal,
          getValue: (d: DayResult) => d.nutrition.calories || null,
          goal: goals.calories,
          color: '#f59e0b',
          type: 'bar' as const,
        },
        {
          label: t.weekly.avgSteps,
          unit: '',
          getValue: (d: DayResult) => d.steps,
          goal: goals.steps_goal,
          color: 'var(--success)',
          type: 'bar' as const,
        },
      ].map(({ label, unit, getValue, goal, color, type }) => (
        <div key={label} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-2 flex items-center justify-between" style={{ color: 'var(--text)' }}>
            <span>{label}</span>
            {unit && <span>{unit}</span>}
          </div>
          <TrendChart days={days} getValue={getValue} goal={goal} color={color} type={type} lang={lang} />
        </div>
      ))}

      {/* Daily params table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {/* Header */}
        <div
          className="grid text-xs font-medium px-3 py-2"
          style={{ gridTemplateColumns: '100px repeat(7, 1fr)', backgroundColor: 'var(--surface2)', color: 'var(--text-muted)' }}
        >
          <div>{t.weekly.parameter}</div>
          {days.map((d) => {
            const score = dayScore(d.hits, DAILY_PARAMS.map((p) => p.key))
            const total = DAILY_PARAMS.length
            return (
              <div key={d.date} className="text-center flex flex-col items-center gap-0.5">
                <span>{shortDay(d.date, lang)}</span>
                <span className="text-xs font-bold" style={{ color: dayColor(score, total) }}>
                  {d.nutrition.calories > 0 ? `${score}/${total}` : '—'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Daily rows */}
        {DAILY_PARAMS.map(({ key, label, unit, getValue }, i) => (
          <div
            key={key}
            className="grid px-3 py-2 text-xs items-center"
            style={{
              gridTemplateColumns: '100px repeat(7, 1fr)',
              backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ color: 'var(--text)' }}>
              <div>{label}</div>
              <div style={{ color: 'var(--text-muted)' }}>{unit}</div>
            </div>
            {days.map((d) => {
              const val = getValue(d.nutrition)
              const hit = d.hits[key]
              const hasData = d.nutrition.calories > 0
              return (
                <div key={d.date} className="text-center" style={{ color: !hasData ? 'var(--text-muted)' : hit ? 'var(--success)' : 'var(--danger)' }}>
                  {hasData ? val : '—'}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Weekly totals */}
      <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.weekly.weekly}</div>
        {[
          { label: t.params.omega3, value: weeklyOmega3.toFixed(1), goal: goals.omega3_g, unit: t.units.g },
          { label: t.params.eggs, value: weeklyEggs, goal: goals.eggs, unit: t.units.pcs },
          { label: t.params.seafood, value: weeklySeafood.toFixed(1), goal: goals.seafood_portions, unit: t.units.srv },
        ].map(({ label, value, goal, unit }) => {
          const hit = Number(value) >= goal
          return (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color: hit ? 'var(--success)' : 'var(--text)' }}>
                {value} / {goal} {unit}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
