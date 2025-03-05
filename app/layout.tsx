import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IDMC Metadata Upload',
  description: 'User Interface for validating & submitting data mapping documentation containing source to target lineage & business terms to Informatica Cloud\'s Data Catalog.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 font-sans">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
} 