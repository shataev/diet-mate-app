import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Diet Mate',
  description: 'Контроль питания и веса',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="min-h-screen flex flex-col">
          <nav
            style={{
              backgroundColor: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
            }}
            className="px-4 py-3"
          >
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <Link href="/" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                🥗 Diet Mate
              </Link>
              <div className="flex gap-6">
                <Link href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Сегодня
                </Link>
                <Link href="/weekly" className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Неделя
                </Link>
                <Link href="/settings" className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Цели
                </Link>
              </div>
            </div>
          </nav>
          <main className="flex-1 px-4 py-6">
            <div className="max-w-2xl mx-auto">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
