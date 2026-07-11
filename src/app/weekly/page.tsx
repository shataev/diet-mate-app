'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { DailyNutrition, Goals, Profile, BodyMeasurement } from '@/types'

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
  evaluateHit,
}: {
  days: DayResult[]
  getValue: (d: DayResult) => number | null
  goal?: number
  color: string
  type?: 'bar' | 'line'
  lang: string
  evaluateHit?: (v: number, goal: number) => boolean
}) {
  const W = 300, H = 80, PAD = 4, BOTTOM = 18
  const vals = days.map(getValue)
  const defined = vals.filter((v) => v !== null) as number[]
  if (defined.length === 0) return <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>—</div>

  const min = type === 'line' ? Math.min(...defined) * 0.98 : 0
  const max = Math.max(...defined, goal ?? 0) * 1.05 || 1
  const range = max - min || 1

  const xStep = days.length > 1 ? (W - PAD * 2) / (days.length - 1) : 0
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
      {goalY !== null && goal !== undefined && (
        <>
          <line x1={PAD} y1={goalY} x2={W - PAD} y2={goalY}
            stroke="rgba(180,180,180,0.5)" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={W - PAD} y={goalY - 3} textAnchor="end" fontSize="8" fill="rgba(180,180,180,0.7)">
            {goal.toLocaleString()}
          </text>
        </>
      )}
      {type === 'bar' && days.map((d, i) => {
        const v = getValue(d)
        if (v === null) return null
        const barH = Math.max(2, ((v - min) / range) * (H - BOTTOM - PAD))
        const hit = goal !== undefined ? (evaluateHit ? evaluateHit(v, goal) : v >= goal) : true
        const cx = barX(i) + barW / 2
        const labelY = H - BOTTOM - barH - 3
        return (
          <g key={d.date}>
            <rect x={barX(i)} y={H - BOTTOM - barH} width={barW} height={barH}
              fill={hit ? color : 'var(--danger)'} rx="2" opacity="0.85" />
            <text x={cx} y={Math.max(labelY, 8)} textAnchor="middle" fontSize="9" fill="var(--text)">
              {typeof v === 'number' ? v.toLocaleString() : v}
            </text>
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
              const cx = PAD + i * xStep
              const cy = yScale(v)
              const labelY = cy > 12 ? cy - 5 : cy + 12
              return (
                <g key={d.date}>
                  <circle cx={cx} cy={cy} r="3" fill={color} />
                  <text x={cx} y={labelY} textAnchor="middle" fontSize="9" fill="var(--text)">
                    {typeof v === 'number' ? v.toLocaleString() : v}
                  </text>
                </g>
              )
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

function localDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return localDate(d)
}

function addWeeks(weekStart: string, n: number): string {
  const d = new Date(weekStart + 'T12:00:00')
  d.setDate(d.getDate() + n * 7)
  return localDate(d)
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return localDate(d)
}

function InlineMetric({
  label,
  value,
  unit,
  previousValue,
  format,
}: {
  label: string
  value: number | null
  unit: string
  previousValue: number | null
  format: (v: number) => string
}) {
  const delta = value !== null && previousValue !== null ? value - previousValue : null
  const color = delta === null || delta === 0 ? 'var(--text-muted)' : delta < 0 ? 'var(--success)' : 'var(--danger)'
  const arrow = delta === null || delta === 0 ? '' : delta < 0 ? '↓' : '↑'

  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {value !== null ? `${format(value)} ${unit}` : '—'}
      </span>
      {delta !== null && (
        <span className="text-xs" style={{ color }}>
          {arrow}{format(Math.abs(delta))}
        </span>
      )}
    </div>
  )
}

export default function WeeklyPage() {
  const { t, lang } = useLang()
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const today = localDate()
  const [weekStart, setWeekStart] = useState(() => getMondayOf(today))
  const currentWeekStart = getMondayOf(today)
  const isCurrentWeek = weekStart === currentWeekStart

  const [profile, setProfile] = useState<Profile>({ gender: null, height_cm: null })
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [editingMeasurements, setEditingMeasurements] = useState(false)
  const [neckInput, setNeckInput] = useState('')
  const [waistInput, setWaistInput] = useState('')
  const [hipInput, setHipInput] = useState('')
  const [savingMeasurements, setSavingMeasurements] = useState(false)
  const measurementsCardRef = useRef<HTMLDivElement>(null)

  const loadMeasurements = useCallback(async () => {
    const d = await fetch('/api/body-measurements').then((r) => r.json())
    setProfile(d.profile)
    setMeasurements(d.measurements)
  }, [])

  useEffect(() => {
    loadMeasurements()
  }, [loadMeasurements])

  const saveMeasurements = useCallback(async () => {
    setSavingMeasurements(true)
    await fetch('/api/body-measurements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: today,
        neck_cm: neckInput === '' ? null : parseFloat(neckInput),
        waist_cm: waistInput === '' ? null : parseFloat(waistInput),
        hip_cm: hipInput === '' ? null : parseFloat(hipInput),
      }),
    })
    await loadMeasurements()
    setEditingMeasurements(false)
    setSavingMeasurements(false)
  }, [today, neckInput, waistInput, hipInput, loadMeasurements])

  useEffect(() => {
    if (!editingMeasurements) return
    const handler = (e: MouseEvent) => {
      if (measurementsCardRef.current && !measurementsCardRef.current.contains(e.target as Node)) {
        setEditingMeasurements(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editingMeasurements])

  const DAILY_PARAMS: { key: string; label: string; unit: string; getValue: (n: DailyNutrition) => string | number }[] = [
    { key: 'calories', label: t.params.calories, unit: t.units.kcal, getValue: (n) => n.calories },
    { key: 'protein', label: t.params.protein, unit: t.units.g, getValue: (n) => n.protein_g },
    { key: 'vegetables', label: t.params.vegetables, unit: t.units.g, getValue: (n) => Math.round(n.vegetables_g) },
    { key: 'avocado', label: t.params.avocado, unit: t.units.g, getValue: (n) => Math.round(n.avocado_g) },
    { key: 'calcium', label: t.params.calcium, unit: t.units.mg, getValue: (n) => n.calcium_mg },
  ]

  useEffect(() => {
    setLoading(true)
    fetch(`/api/weekly?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [weekStart])

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

  const weekEnd = addWeeks(weekStart, 1)
  const weekEndDate = new Date(weekEnd + 'T12:00:00')
  weekEndDate.setDate(weekEndDate.getDate() - 1)
  const weekLabel = `${new Date(weekStart + 'T12:00:00').toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })} – ${weekEndDate.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' })}`
  const weekEndStr = localDate(weekEndDate)

  const measurementsInWeek = measurements.filter((m) => m.date >= weekStart && m.date <= weekEndStr)
  const currentMeasurement = measurementsInWeek.length > 0 ? measurementsInWeek[measurementsInWeek.length - 1] : null
  const currentIndex = currentMeasurement ? measurements.findIndex((m) => m.date === currentMeasurement.date) : -1
  const previousMeasurement = currentIndex > 0 ? measurements[currentIndex - 1] : null
  const todaysMeasurement = measurements.find((m) => m.date === today) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {t.weekly.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: 'var(--surface2)', color: 'var(--text)' }}
          >‹</button>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{weekLabel}</span>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            disabled={isCurrentWeek}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: 'var(--surface2)', color: isCurrentWeek ? 'var(--border)' : 'var(--text)' }}
          >›</button>
        </div>
      </div>

      {/* Weight + Steps */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{t.weekly.weightLatest}</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {daysWithWeight.length > 0 ? `${daysWithWeight[daysWithWeight.length - 1].weight_kg?.toFixed(2)}` : '—'}
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

      {/* Body composition */}
      <div ref={measurementsCardRef} className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{t.weekly.bodyComposition}</div>
          {isCurrentWeek && !editingMeasurements && (
            <button
              onClick={() => {
                setNeckInput(todaysMeasurement?.neck_cm != null ? String(todaysMeasurement.neck_cm) : '')
                setWaistInput(todaysMeasurement?.waist_cm != null ? String(todaysMeasurement.waist_cm) : '')
                setHipInput(todaysMeasurement?.hip_cm != null ? String(todaysMeasurement.hip_cm) : '')
                setEditingMeasurements(true)
              }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              ✎ {t.weekly.editMeasurements}
            </button>
          )}
        </div>

        {editingMeasurements ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.params.neck} ({t.units.cm})</span>
                <input
                  type="number" step="0.1" min="0" value={neckInput}
                  onChange={(e) => setNeckInput(e.target.value)}
                  autoFocus
                  className="text-lg font-semibold bg-transparent border-b-2 outline-none"
                  style={{ color: 'var(--text)', borderColor: 'var(--accent)' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.params.waist} ({t.units.cm})</span>
                <input
                  type="number" step="0.1" min="0" value={waistInput}
                  onChange={(e) => setWaistInput(e.target.value)}
                  className="text-lg font-semibold bg-transparent border-b-2 outline-none"
                  style={{ color: 'var(--text)', borderColor: 'var(--accent)' }}
                />
              </label>
              {profile.gender === 'female' && (
                <label className="flex flex-col gap-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.params.hip} ({t.units.cm})</span>
                  <input
                    type="number" step="0.1" min="0" value={hipInput}
                    onChange={(e) => setHipInput(e.target.value)}
                    className="text-lg font-semibold bg-transparent border-b-2 outline-none"
                    style={{ color: 'var(--text)', borderColor: 'var(--accent)' }}
                  />
                </label>
              )}
            </div>
            <button
              onClick={saveMeasurements}
              disabled={savingMeasurements}
              className="mt-1 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              ✓ {t.settings.save}
            </button>
          </div>
        ) : !profile.gender || !profile.height_cm ? (
          <>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.weekly.needProfile}</div>
            {currentMeasurement && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <InlineMetric label={t.params.waist} value={currentMeasurement.waist_cm} unit={t.units.cm} previousValue={previousMeasurement?.waist_cm ?? null} format={(v) => v.toFixed(1)} />
                <InlineMetric label={t.params.neck} value={currentMeasurement.neck_cm} unit={t.units.cm} previousValue={previousMeasurement?.neck_cm ?? null} format={(v) => v.toFixed(1)} />
              </div>
            )}
          </>
        ) : currentMeasurement ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <InlineMetric label={t.params.bodyFat} value={currentMeasurement.body_fat_pct} unit={t.units.percent} previousValue={previousMeasurement?.body_fat_pct ?? null} format={(v) => v.toFixed(1)} />
            <InlineMetric label={t.params.waist} value={currentMeasurement.waist_cm} unit={t.units.cm} previousValue={previousMeasurement?.waist_cm ?? null} format={(v) => v.toFixed(1)} />
            <InlineMetric label={t.params.neck} value={currentMeasurement.neck_cm} unit={t.units.cm} previousValue={previousMeasurement?.neck_cm ?? null} format={(v) => v.toFixed(1)} />
            {profile.gender === 'female' && (
              <InlineMetric label={t.params.hip} value={currentMeasurement.hip_cm} unit={t.units.cm} previousValue={previousMeasurement?.hip_cm ?? null} format={(v) => v.toFixed(1)} />
            )}
          </div>
        ) : (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{t.weekly.noMeasurements}</div>
        )}
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
          color: 'var(--success)',
          type: 'bar' as const,
          evaluateHit: (v: number, goal: number) => v <= goal + 50,
        },
        {
          label: t.weekly.avgSteps,
          unit: '',
          getValue: (d: DayResult) => d.steps,
          goal: goals.steps_goal,
          color: 'var(--success)',
          type: 'bar' as const,
        },
      ].map(({ label, unit, getValue, goal, color, type, evaluateHit }) => (
        <div key={label} className="p-4 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-medium mb-2 flex items-center justify-between" style={{ color: 'var(--text)' }}>
            <span>{label}</span>
            {unit && <span>{unit}</span>}
          </div>
          <TrendChart days={days} getValue={getValue} goal={goal} color={color} type={type} lang={lang} evaluateHit={evaluateHit} />
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
