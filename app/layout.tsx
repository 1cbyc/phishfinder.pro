import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PhishDetect - URL Security Analysis',
  description: 'Analyze URLs for phishing and malicious content using multiple threat intelligence sources',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

