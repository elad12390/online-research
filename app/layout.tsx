import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Research Portal',
  description: 'Modern research management platform with Notion-style design',
  viewport: 'width=device-width, initial-scale=1.0',
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
