import type { Metadata, Viewport } from 'next'
import { Syne, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800']
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['300', '400', '500', '600']
})

const instrumentSerif = Instrument_Serif({ 
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic']
})

export const metadata: Metadata = {
  title: 'SmartEVP+ | Emergency Vehicle Preemption System',
  description: 'A full end-to-end emergency dispatch, traffic preemption, and hospital readiness platform — built for lives that can\'t wait.',
  generator: 'SmartEVP+',
  keywords: ['emergency', 'ambulance', 'traffic preemption', 'hospital readiness', 'smart city', 'IoT'],
  authors: [{ name: 'Team V3' }],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#080b12',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${syne.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} bg-bg`}>
      <body className="font-mono antialiased noise-overlay">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
