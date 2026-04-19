import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/contexts/LanguageContext'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'Diet Mate',
  description: 'Nutrition tracking and weight control',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Diet Mate',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
            <NavBar />
            <main className="flex-1 px-4 py-6 pb-12">
              <div className="max-w-2xl mx-auto">{children}</div>
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}
