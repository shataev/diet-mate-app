'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLang } from '@/contexts/LanguageContext'
import { Language } from '@/lib/i18n'

export default function NavBar() {
  const { lang, t, setLang } = useLang()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/', label: t.nav.today },
    { href: '/weekly', label: t.nav.week },
    { href: '/settings', label: t.nav.goals },
    { href: '/categories', label: t.nav.categories },
  ]

  const LangToggle = () => (
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
  )

  return (
    <nav
      style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="px-4 py-3"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          🥗 Diet Mate
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {l.label}
            </Link>
          ))}
          <LangToggle />
        </div>

        {/* Mobile burger */}
        <button
          className="sm:hidden p-1"
          style={{ color: 'var(--text-muted)' }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="sm:hidden max-w-2xl mx-auto mt-3 flex flex-col gap-3 pb-2"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-base font-medium"
              style={{ color: 'var(--text)' }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="self-start">
            <LangToggle />
          </div>
        </div>
      )}
    </nav>
  )
}
