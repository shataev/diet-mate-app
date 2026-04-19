'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/contexts/LanguageContext'

interface DayResult {
  date: string
  weight_kg: number | null
  steps: number | null
  hits: Record<string, boolean>
}

interface WeeklyData {
  days: DayResult[]
  avgSteps: number
}

function shortDate(dateStr: string, lang: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short', day: 'numeric' })
}

export default function WeeklyPage() {
  const { t, lang } = useLang()
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)

  const PARAMS = ['calories', 'protein', 'vegetables', 'avocado', 'calcium', 'omega3', 'eggs', 'seafood']
  const PARAM_LABELS: Record<string, string> = {
    calories: t.params.calories,
    protein: t.params.protein,
    vegetables: t.params.vegetables,
    avocado: t.params.avocado,
    calcium: t.params.calcium,
    omega3: t.params.omega3,
    eggs: t.params.eggs,
    seafood: t.params.seafood,
  }

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

  const daysWithWeight = data.days.filter((d) => d.weight_kg !== null)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
        {t.weekly.title}
      </h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {t.weekly.weightLatest}
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {daysWithWeight.length > 0
              ? `${daysWithWeight[daysWithWeight.length - 1].weight_kg} kg`
              : '—'}
          </div>
          {daysWithWeight.length >= 2 && (() => {
            const diff =
              (daysWithWeight[daysWithWeight.length - 1].weight_kg ?? 0) -
              (daysWithWeight[0].weight_kg ?? 0)
            return (
              <div
                className="text-xs mt-1"
                style={{ color: diff < 0 ? 'var(--success)' : diff > 0 ? 'var(--danger)' : 'var(--text-muted)' }}
              >
                {t.weekly.weekDelta(`${diff > 0 ? '+' : ''}${diff.toFixed(1)}`)}
              </div>
            )
          })()}
        </div>
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {t.weekly.avgSteps}
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {data.avgSteps > 0 ? data.avgSteps.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US') : '—'}
          </div>
        </div>
      </div>

      {daysWithWeight.length > 1 && (
        <div
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
            {t.weekly.weightTrend}
          </div>
          <div className="flex items-end gap-2 h-20">
            {data.days.map((day) => {
              const weights = daysWithWeight.map((d) => d.weight_kg ?? 0)
              const min = Math.min(...weights)
              const max = Math.max(...weights)
              const range = max - min || 1
              const h = day.weight_kg !== null
                ? Math.max(4, ((day.weight_kg - min) / range) * 64 + 4)
                : 0
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${h}px`,
                      backgroundColor: day.weight_kg !== null ? 'var(--accent)' : 'var(--surface2)',
                    }}
                  />
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    {shortDate(day.date, lang).split(',')[0]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div
          className="grid text-xs font-medium px-3 py-2"
          style={{
            gridTemplateColumns: '130px repeat(7, 1fr)',
            backgroundColor: 'var(--surface2)',
            color: 'var(--text-muted)',
          }}
        >
          <div>{t.weekly.parameter}</div>
          {data.days.map((d) => (
            <div key={d.date} className="text-center">
              {shortDate(d.date, lang).split(',')[0]}
            </div>
          ))}
        </div>

        {PARAMS.map((param, i) => (
          <div
            key={param}
            className="grid px-3 py-2 text-xs items-center"
            style={{
              gridTemplateColumns: '130px repeat(7, 1fr)',
              backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div style={{ color: 'var(--text)' }}>{PARAM_LABELS[param]}</div>
            {data.days.map((d) => (
              <div key={d.date} className="text-center text-base">
                {d.hits[param]
                  ? <span style={{ color: 'var(--success)' }}>✓</span>
                  : <span style={{ color: 'var(--border)' }}>·</span>}
              </div>
            ))}
          </div>
        ))}

        <div
          className="grid px-3 py-2 text-xs font-semibold"
          style={{
            gridTemplateColumns: '130px repeat(7, 1fr)',
            backgroundColor: 'var(--surface2)',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <div>{t.weekly.total}</div>
          {data.days.map((d) => {
            const hits = Object.values(d.hits).filter(Boolean).length
            return (
              <div
                key={d.date}
                className="text-center"
                style={{ color: hits >= 5 ? 'var(--success)' : 'var(--text)' }}
              >
                {hits}/{PARAMS.length}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
