'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Provider = 'anthropic' | 'openai' | 'google'

interface ProviderConfig {
  name: string
  color: string
  icon: string
  keyPrefix: string
  docsUrl: string
  keyUrl: string
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    color: 'bg-orange-600 hover:bg-orange-700',
    icon: '🤖',
    keyPrefix: 'sk-ant-api03-',
    docsUrl: 'https://docs.anthropic.com',
    keyUrl: 'https://console.anthropic.com/settings/keys'
  },
  openai: {
    name: 'OpenAI (GPT)',
    color: 'bg-green-600 hover:bg-green-700',
    icon: '🔮',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/docs',
    keyUrl: 'https://platform.openai.com/api-keys'
  },
  google: {
    name: 'Google AI (Gemini)',
    color: 'bg-blue-600 hover:bg-blue-700',
    icon: '⚡',
    keyPrefix: 'AIza',
    docsUrl: 'https://ai.google.dev/docs',
    keyUrl: 'https://makersuite.google.com/app/apikey'
  }
}

interface ProviderStatus {
  hasKey: boolean
  keyValid: boolean
}

interface AuthStatus {
  providers: Record<Provider, ProviderStatus>
  hasAnyProvider: boolean
}

export default function AuthPage() {
  const router = useRouter()
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      setAuthStatus(data)
    } catch (err) {
      setError('Failed to check authentication status')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider)
    setApiKey('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProvider) return

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/auth/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider: selectedProvider,
          apiKey: apiKey.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh auth status
        await checkAuthStatus()
        
        // Reset form
        setSelectedProvider(null)
        setApiKey('')
        
        // Show success message briefly then redirect if they have any provider
        setTimeout(() => {
          if (data.hasAnyProvider) {
            router.push('/wizard')
          }
        }, 1500)
      } else {
        setError(data.error || 'Failed to set API key')
      }
    } catch (err) {
      setError('Failed to save API key. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !authStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Already authenticated - show connected providers
  if (authStatus?.hasAnyProvider && !selectedProvider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connected Providers</h1>
            <p className="text-gray-600 mb-6">
              You can use any of these AI providers for research
            </p>
          </div>

          {/* Connected Providers */}
          <div className="space-y-3 mb-6">
            {(Object.entries(authStatus.providers) as [Provider, ProviderStatus][]).map(([provider, status]) => (
              <div 
                key={provider}
                className={`p-4 rounded-lg border-2 ${
                  status.hasKey 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{PROVIDERS[provider].icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{PROVIDERS[provider].name}</h3>
                      <p className="text-sm text-gray-600">
                        {status.hasKey ? '✅ API Key configured' : '❌ Not configured'}
                      </p>
                    </div>
                  </div>
                  {status.hasKey && (
                    <button
                      onClick={() => handleProviderSelect(provider)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Update Key
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Provider Button */}
          {Object.values(authStatus.providers).some(p => !p.hasKey) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Another Provider</h3>
              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(authStatus.providers) as [Provider, ProviderStatus][])
                  .filter(([_, status]) => !status.hasKey)
                  .map(([provider]) => (
                    <button
                      key={provider}
                      onClick={() => handleProviderSelect(provider)}
                      className={`p-3 rounded-lg text-white font-medium transition-colors ${PROVIDERS[provider].color}`}
                    >
                      <span className="mr-2">{PROVIDERS[provider].icon}</span>
                      Add {PROVIDERS[provider].name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/wizard')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Research Wizard →
          </button>
        </div>
      </div>
    )
  }

  // Provider selection or API key input
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        {!selectedProvider ? (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose AI Provider</h1>
              <p className="text-gray-600">
                Connect at least one AI provider to use the Research Wizard
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {(Object.entries(PROVIDERS) as [Provider, ProviderConfig][]).map(([provider, config]) => (
                <button
                  key={provider}
                  onClick={() => handleProviderSelect(provider)}
                  className={`w-full p-4 rounded-lg text-white font-medium transition-colors ${config.color} flex items-center justify-between`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{config.icon}</span>
                    <span>{config.name}</span>
                  </div>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Your API keys are stored securely in environment variables.
                <br />
                You can add multiple providers for flexibility.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <button
                onClick={() => {
                  setSelectedProvider(null)
                  setApiKey('')
                  setError(null)
                }}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center mb-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{PROVIDERS[selectedProvider].icon}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {PROVIDERS[selectedProvider].name}
                </h2>
                <p className="text-gray-600 text-sm">
                  Enter your API key to enable this provider
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm">How to get your API key:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Visit the API keys page</li>
                <li>2. Create a new API key</li>
                <li>3. Copy and paste it below</li>
              </ol>
              <a
                href={PROVIDERS[selectedProvider].keyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-sm text-blue-600 hover:underline"
              >
                Open API Keys Page →
              </a>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`${PROVIDERS[selectedProvider].keyPrefix}...`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !apiKey.trim()}
                className={`w-full text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${PROVIDERS[selectedProvider].color}`}
              >
                {submitting ? 'Saving...' : 'Save API Key'}
              </button>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> API keys are stored in <code className="bg-gray-200 px-1 py-0.5 rounded">.env.local</code> and require a server restart to take effect.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
