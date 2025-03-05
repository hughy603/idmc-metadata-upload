import type { Metadata } from 'next'
import { Inter as _Inter } from 'next/font/google'

import { MockAuthProvider } from '@/lib/providers/mock-auth-provider'
import './globals.css'

import DevMockAuth from './components/dev-mock-auth'

export const metadata: Metadata = {
  title: 'IDMC Metadata Upload',
  description:
    "User Interface for validating & submitting data mapping documentation containing source to target lineage & business terms to Informatica Cloud's Data Catalog.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-gray-50 font-sans dark:bg-gray-950">
        <MockAuthProvider>
          <main className="min-h-screen">{children}</main>
          <DevMockAuth />
        </MockAuthProvider>
      </body>
    </html>
  )
}
