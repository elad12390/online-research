'use client'

import React, { useState } from 'react'

interface FormData {
  topic: string
  depth: 'quick' | 'standard' | 'deep'
  focus: string
  style: 'comprehensive' | 'comparing' | 'practical'
  provider: 'anthropic' | 'openai' | 'google' | 'auto'
  model: string
}

// Available models per provider (updated November 2025)
const PROVIDER_MODELS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 (Recommended)' },
    { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (Faster/Cheaper)' },
    { value: 'claude-opus-4-5', label: 'Claude Opus 4.5 (Most Capable)' },
  ],
  openai: [
    { value: 'gpt-4.1', label: 'GPT-4.1 (Recommended)' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (Faster/Cheaper)' },
    { value: 'o4-mini', label: 'o4-mini (Advanced Reasoning)' },
  ],
  google: [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Recommended)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Faster/Cheaper)' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Most Capable)' },
  ],
  auto: [
    { value: 'auto', label: 'Auto-select best model' },
  ],
}

// Default model for each provider
const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4.1',
  google: 'gemini-2.5-pro',
  auto: 'auto',
}

interface ResearchWizardFormProps {
  onSuccess?: (researchId: string) => void
}

export const ResearchWizardForm: React.FC<ResearchWizardFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    topic: '',
    depth: 'standard',
    focus: '',
    style: 'comprehensive',
    provider: 'auto',
    model: 'auto',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // When provider changes, also update model to the default for that provider
    if (name === 'provider') {
      setFormData((prev) => ({
        ...prev,
        provider: value as FormData['provider'],
        model: DEFAULT_MODELS[value] || 'auto',
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }
  
  // Get available models for current provider
  const availableModels = PROVIDER_MODELS[formData.provider] || PROVIDER_MODELS.auto

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start research')
      }

      const { researchId } = await response.json()
      setSuccess(`✅ Research started! ID: ${researchId}`)
      setFormData({ topic: '', depth: 'standard', focus: '', style: 'comprehensive', provider: 'auto', model: 'auto' })

      if (onSuccess) {
        onSuccess(researchId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">🔬 Research Wizard</h1>
        <p className="text-gray-600">Start a new AI-powered research project</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div>
          <label htmlFor="topic" className="block text-sm font-semibold mb-2 text-gray-900">
            Research Topic <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="e.g., Best Coffee Machines for Apartments"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            What would you like to research?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-semibold mb-2 text-gray-900">
              AI Provider
            </label>
            <select
              id="provider"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="auto">Auto-detect</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="google">Google (Gemini)</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Which AI to use for research
            </p>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-semibold mb-2 text-gray-900">
              Model
            </label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              {availableModels.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Specific model to use
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="depth" className="block text-sm font-semibold mb-2 text-gray-900">
              Research Depth
            </label>
            <select
              id="depth"
              name="depth"
              value={formData.depth}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="quick">Quick (15-20 min)</option>
              <option value="standard">Standard (45-60 min)</option>
              <option value="deep">Deep (2+ hours)</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              How thorough should it be?
            </p>
          </div>

          <div>
            <label htmlFor="style" className="block text-sm font-semibold mb-2 text-gray-900">
              Research Style
            </label>
            <select
              id="style"
              name="style"
              value={formData.style}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            >
              <option value="comprehensive">Comprehensive</option>
              <option value="comparing">Comparing</option>
              <option value="practical">Practical</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              How to present results?
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="focus" className="block text-sm font-semibold mb-2 text-gray-900">
            Focus Area <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            id="focus"
            name="focus"
            value={formData.focus}
            onChange={handleChange}
            placeholder="e.g., Budget under $500, Low-odor options"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            Any specific constraints or focus areas?
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              <span className="font-semibold">❌ Error:</span> {error}
            </p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              <span className="font-semibold">{success}</span>
            </p>
            <p className="text-green-700 text-xs mt-2">
              Check the Research Hub sidebar to track progress
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !formData.topic.trim()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? '🔄 Starting Research...' : '▶️ Start Research'}
        </button>
      </form>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-2 text-gray-900">💡 Tips</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Be specific with your research topic for better results</li>
          <li>Quick research is best for overviews, deep for comprehensive guides</li>
          <li>Use focus area to narrow down results to what matters most</li>
          <li>All research results are saved to the Research Portal</li>
        </ul>
      </div>
    </div>
  )
}

export default ResearchWizardForm
