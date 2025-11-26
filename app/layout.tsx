import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Research Portal',
  description: 'AI-powered research assistant with web search, multi-provider LLM support, and a beautiful web interface.',
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512' },
    ],
  },
  openGraph: {
    title: 'Research Portal',
    description: 'AI-powered research assistant with web search, multi-provider LLM support, and a beautiful web interface.',
    images: ['/logo.png'],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon-32.png" type="image/png" />
      </head>
      <body className="bg-notion-bg-primary text-notion-text-primary overflow-hidden">
        <Toaster 
          theme="dark" 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e1e',
              color: '#ececec',
              border: '1px solid #3d3d3d',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
