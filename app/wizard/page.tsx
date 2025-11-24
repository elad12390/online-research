'use client'

import { useState, useEffect } from 'react'
import { ResearchWizardForm } from '@/components/ResearchWizardForm'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function WizardPage() {
  const router = useRouter()
  const [researchId, setResearchId] = useState<string | null>(null)
  const [authChecking, setAuthChecking] = useState(true)

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/claude')
      const data = await response.json()
      
      if (!data.authenticated) {
        // Not authenticated, redirect to auth page
        router.push('/auth')
      } else {
        setAuthChecking(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setAuthChecking(false)
    }
  }

  const handleSuccess = (id: string) => {
    setResearchId(id)
    // Could redirect or show confirmation here
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  }

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      {/* Header Bar */}
      <div className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
          ← Back to Portal
        </Link>
        <h2 className="text-sm font-medium text-gray-600">Research Portal</h2>
      </div>

      {/* Form */}
      <ResearchWizardForm onSuccess={handleSuccess} />

      {/* Footer */}
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Need help? Check the documentation or try the CLI wizard
        </p>
        <div className="flex justify-center gap-4">
          <code className="px-3 py-1 bg-gray-200 rounded text-sm text-gray-700 font-mono">
            research-wizard start
          </code>
        </div>
      </div>
    </div>
  )
}
