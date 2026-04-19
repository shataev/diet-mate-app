'use client'

import Link from 'next/link'
import { useLang } from '@/contexts/LanguageContext'
import { Language } from '@/lib/i18n'

export default function NavBar() {
  const { lang, t, setLang } = useLang()

  return (
    <nav
      style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="px-4 py-3"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          🥗 Diet Mate
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t.nav.today}
          </Link>
          <Link href="/weekly" className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t.nav.week}
          </Link>
          <Link href="/settings" className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t.nav.goals}
          </Link>
          <div
            className="flex text-xs rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {(['en', 'ru'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-2 py-1 uppercase"
                style={{
                  backgroundColor: lang === l ? 'var(--accent)' : 'var(--surface2)',
                  color: lang === l ? '#fff' : 'var(--text-muted)',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
