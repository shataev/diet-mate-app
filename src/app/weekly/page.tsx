'use client'

import { useEffect, useState } from 'react'

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

const PARAM_LABELS: Record<string, string> = {
  calories: 'Калории',
  vegetables: 'Растительность',
  avocado: 'Авокадо',
  calcium: 'Кальций',
  omega3: 'Омега-3',
  eggs: 'Яйца',
  seafood: 'Морепродукты',
}

const PARAMS = Object.keys(PARAM_LABELS)

function shortDate(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' })
}

export default function WeeklyPage() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    fetch(`/api/weekly?date=${today}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
  }, [])

  if (loading || !data) {
    return (
      <div style={{ color: 'var(--text-muted)' }} className="text-center py-12">
        Загружаем данные за неделю...
      </div>
    )
  }

  const daysWithWeight = data.days.filter((d) => d.weight_kg !== null)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
        Отчёт за неделю
      </h1>

      {/* Вес и шаги сводка */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Вес (последний)
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {daysWithWeight.length > 0
              ? `${daysWithWeight[daysWithWeight.length - 1].weight_kg} кг`
              : '—'}
          </div>
          {daysWithWeight.length >= 2 && (() => {
            const diff = (daysWithWeight[daysWithWeight.length - 1].weight_kg ?? 0) -
              (daysWithWeight[0].weight_kg ?? 0)
            return (
              <div
                className="text-xs mt-1"
                style={{ color: diff < 0 ? 'var(--success)' : diff > 0 ? 'var(--danger)' : 'var(--text-muted)' }}
              >
                {diff > 0 ? '+' : ''}{diff.toFixed(1)} кг за неделю
              </div>
            )
          })()}
        </div>
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Среднее шагов
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {data.avgSteps > 0 ? data.avgSteps.toLocaleString('ru-RU') : '—'}
          </div>
        </div>
      </div>

      {/* График веса */}
      {daysWithWeight.length > 1 && (
        <div
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
            Динамика веса
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
                  <div className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    {shortDate(day.date).split(',')[0]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Таблица попаданий в цели */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        <div
          className="grid text-xs font-medium px-3 py-2"
          style={{
            gridTemplateColumns: '120px repeat(7, 1fr)',
            backgroundColor: 'var(--surface2)',
            color: 'var(--text-muted)',
          }}
        >
          <div>Параметр</div>
          {data.days.map((d) => (
            <div key={d.date} className="text-center">
              {shortDate(d.date).split(',')[0]}
            </div>
          ))}
        </div>

        {PARAMS.map((param, i) => {
          const hitCount = data.days.filter((d) => d.hits[param]).length
          return (
            <div
              key={param}
              className="grid px-3 py-2 text-xs items-center"
              style={{
                gridTemplateColumns: '120px repeat(7, 1fr)',
                backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div style={{ color: 'var(--text)' }}>{PARAM_LABELS[param]}</div>
              {data.days.map((d) => (
                <div key={d.date} className="text-center text-base">
                  {d.hits[param] ? (
                    <span style={{ color: 'var(--success)' }}>✓</span>
                  ) : (
                    <span style={{ color: 'var(--border)' }}>·</span>
                  )}
                </div>
              ))}
            </div>
          )
        })}

        <div
          className="grid px-3 py-2 text-xs font-semibold"
          style={{
            gridTemplateColumns: '120px repeat(7, 1fr)',
            backgroundColor: 'var(--surface2)',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <div>Итого</div>
          {data.days.map((d) => {
            const hits = Object.values(d.hits).filter(Boolean).length
            return (
              <div key={d.date} className="text-center" style={{ color: hits >= 5 ? 'var(--success)' : 'var(--text)' }}>
                {hits}/{PARAMS.length}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
