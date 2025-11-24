'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Research {
  id: string
  topic: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: number
  completedAt?: number
  projectDir: string
}

interface Activity {
  id: string
  agentId: string
  timestamp: number
  action: string
  description: string
  metadata?: any
}

interface Agent {
  id: string
  researchId: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: number
  completedAt?: number
  activities?: Activity[]
}

interface Progress {
  percentage: number
  currentTask: string
  currentTaskDescription: string
  completedTasks: string[]
  startedAt: string
  estimatedCompletion: string
}

interface ResearchData {
  research: Research
  agents: Agent[]
  progress?: Progress | null
}

export default function ResearchDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ResearchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [stopping, setStopping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/research/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch research')
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)

    return () => clearInterval(interval)
  }, [params.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.agents])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleStopResearch = async () => {
    if (!data) return
    
    toast('Stop this research?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Stop',
        onClick: async () => {
          setStopping(true)
          try {
            const response = await fetch(`/api/research/${params.id}/stop`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            })
            
            const result = await response.json()
            
            if (response.ok) {
              console.log('Research stopped successfully:', result)
              toast.success('Research stopped successfully')
              // Refresh data immediately
              const refreshResponse = await fetch(`/api/research/${params.id}`)
              if (refreshResponse.ok) {
                const json = await refreshResponse.json()
                setData(json)
              }
            } else {
              console.error('Failed to stop research:', result)
              const errorMsg = result.details || result.error || 'Unknown error'
              toast.error(`Failed to stop research: ${errorMsg}`)
            }
          } catch (err) {
            console.error('Error stopping research:', err)
            toast.error(`Error stopping research: ${err instanceof Error ? err.message : 'Unknown error'}`)
          } finally {
            setStopping(false)
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    })
  }



  const handleSendMessage = async () => {
    if (!userMessage.trim() || !data) return
    
    setSending(true)
    const messageToSend = userMessage
    setUserMessage('') // Clear immediately for better UX
    
    try {
      const response = await fetch(`/api/research/${params.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setUserMessage(messageToSend) // Restore message on error
        toast.error(`Failed to send message: ${result.error || 'Unknown error'}`)
      } else {
        console.log('Message sent successfully:', result)
        
        // If research was auto-resumed, give it a moment to start
        if (result.resumed) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // Refresh data to show the new message and updated status
        const refreshResponse = await fetch(`/api/research/${params.id}`)
        if (refreshResponse.ok) {
          const json = await refreshResponse.json()
          setData(json)
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setUserMessage(messageToSend) // Restore message on error
      toast.error(`Error sending message: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('web_search') || action.includes('search')) return '🔍'
    if (action.includes('crawl') || action.includes('fetch')) return '🌐'
    if (action.includes('file') || action.includes('write')) return '📝'
    if (action.includes('read')) return '📖'
    if (action.includes('tool')) return '🔧'
    if (action.includes('error') || action.includes('fail')) return '❌'
    if (action.includes('complete')) return '✅'
    if (action.includes('start')) return '🚀'
    if (action.includes('user_message')) return '💬'
    if (action.includes('thought')) return '💭'
    if (action.includes('tool_result')) return '📄'
    return '•'
  }

  const getActivityColor = (action: string) => {
    if (action.includes('error') || action.includes('fail')) return 'text-red-400'
    if (action.includes('complete') || action.includes('success')) return 'text-green-400'
    if (action.includes('user_message')) return 'text-blue-400'
    if (action.includes('tool') || action.includes('web')) return 'text-purple-400'
    if (action.includes('thought')) return 'text-yellow-400'
    if (action.includes('tool_result')) return 'text-gray-300'
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#212121] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#212121] p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-blue-400 hover:underline mb-4 block">
            ← Back to Portal
          </Link>
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400">❌ {error || 'Research not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const { research, agents } = data
  const isActive = research.status === 'in_progress' || research.status === 'pending'
  const allActivities = agents.flatMap(agent => 
    (agent.activities || []).map(activity => ({ ...activity, agent }))
  ).sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div className="h-screen flex flex-col bg-[#212121]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#212121] border-b border-gray-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm">
              ← Portal
            </Link>
            <div className="w-px h-4 bg-gray-700" />
            <h1 className="text-lg font-semibold text-white truncate max-w-md">
              {research.topic}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="flex items-center gap-2 text-xs text-emerald-400">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Active
              </span>
            )}
            {research.status === 'completed' && (
              <span className="text-xs text-gray-400">✓ Complete</span>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        {data.progress && isActive && (
          <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-2">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{data.progress.currentTask}</span>
                <span>{data.progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${data.progress.percentage}%` }}
                />
              </div>
              {data.progress.currentTaskDescription && (
                <div className="text-xs text-gray-500 mt-1">
                  {data.progress.currentTaskDescription}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* User Initial Message */}
          <div className="group px-4 py-8 hover:bg-[#2a2a2a] transition-colors">
            <div className="flex gap-4 justify-end">
              <div className="flex flex-col items-end gap-2 max-w-[70%]">
                <div className="bg-[#2f2f2f] rounded-[18px] px-4 py-3 border border-gray-700">
                  <div className="text-white leading-relaxed whitespace-pre-wrap break-words">
                    {research.topic}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatTime(research.createdAt)}
                </div>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                U
              </div>
            </div>
          </div>

          {/* Activities as Messages */}
          {allActivities.map((activity) => {
            console.log('Activity:', activity.action, activity.id, activity.description?.substring(0, 50))
            const isUserMsg = activity.action === 'user_message'
            const isAssistantResponse = activity.action === 'assistant_response'
            const isThought = activity.action === 'thought'
            const isToolCall = activity.action === 'tool_call'
            const isToolResult = activity.action === 'tool_result'
            
            if (isAssistantResponse) {
              console.log('🔵 RENDERING ASSISTANT RESPONSE:', activity.id)
            }
            
            if (isUserMsg) {
              // User message with bubble
              return (
                <div key={activity.id} className="group px-4 py-8 hover:bg-[#2a2a2a] transition-colors">
                  <div className="flex gap-4 justify-end">
                    <div className="flex flex-col items-end gap-2 max-w-[70%]">
                      <div className="bg-[#2f2f2f] rounded-[18px] px-4 py-3 border border-gray-700">
                        <div className="text-white leading-relaxed whitespace-pre-wrap break-words">
                          {activity.description}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                      U
                    </div>
                  </div>
                </div>
              )
            }
            
            // Assistant response - full response to user message
            if (isAssistantResponse) {
              return (
                <div key={activity.id} className="group px-4 py-8 hover:bg-[#2a2a2a] transition-colors">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      A
                    </div>
                    <div className="flex flex-col gap-2 max-w-[85%]">
                      <div className="bg-[#1e1e1e] rounded-[18px] px-4 py-3 border border-gray-700">
                        <div className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                          {activity.description}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Thought message
            if (isThought) {
              return (
                <div 
                  key={activity.id} 
                  className="group px-4 py-4 bg-[#2a2a2a] hover:bg-[#2f2f2f] transition-colors border-t border-gray-800"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-yellow-400 bg-yellow-400/10">
                      💭
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-yellow-400">Thinking</span>
                        <span className="text-xs text-gray-600">{formatTime(activity.timestamp)}</span>
                      </div>
                      <div className="text-gray-400 italic text-[15px] leading-relaxed whitespace-pre-wrap font-mono text-sm bg-black/20 p-3 rounded border border-yellow-400/10">
                        {activity.description}
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Tool Call message - show tool being invoked
            if (isToolCall) {
              const toolName = activity.metadata?.tool || 'Unknown Tool'
              const toolArgs = activity.metadata?.args
              
              return (
                <div 
                  key={activity.id} 
                  className="group px-4 py-4 bg-[#2a2a2a] hover:bg-[#2f2f2f] transition-colors border-t border-gray-800"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-purple-600 flex items-center justify-center text-white">
                      🔧
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-purple-400">Tool Call</span>
                        <span className="text-xs text-gray-600">{formatTime(activity.timestamp)}</span>
                      </div>
                      
                      {/* Tool Name */}
                      <div className="text-white text-[15px] font-medium">
                        {toolName}
                      </div>
                      
                      {/* Arguments Card */}
                      {toolArgs && (
                        <div className="mt-2 bg-black/30 rounded-lg border border-purple-500/20 overflow-hidden">
                          <div className="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20">
                            <span className="text-xs font-semibold text-purple-300">Arguments</span>
                          </div>
                          <div className="p-3">
                            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all overflow-x-auto">
{typeof toolArgs === 'object' 
  ? JSON.stringify(toolArgs, null, 2)
  : typeof toolArgs === 'string' && toolArgs.startsWith('{')
    ? (() => {
        try {
          return JSON.stringify(JSON.parse(toolArgs), null, 2)
        } catch {
          return toolArgs
        }
      })()
    : toolArgs}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }

            // Tool Result message
            if (isToolResult) {
              const output = activity.metadata?.output || activity.description
              const toolName = activity.metadata?.tool || 'Unknown Tool'
              
              return (
                <div 
                  key={activity.id} 
                  className="group px-4 py-4 bg-[#2a2a2a] hover:bg-[#2f2f2f] transition-colors border-t border-gray-800"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-emerald-600 flex items-center justify-center text-white">
                      ✓
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-emerald-400">Tool Result</span>
                        <span className="text-xs text-gray-600">{formatTime(activity.timestamp)}</span>
                      </div>
                      
                      {/* Tool Name */}
                      <div className="text-white text-[15px] font-medium">
                        {toolName}
                      </div>
                      
                      {/* Collapsible Result */}
                      <details className="group/output mt-2" open>
                        <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-200 select-none flex items-center gap-2 bg-black/20 px-3 py-2 rounded border border-emerald-500/20">
                          <span>View output</span>
                          <span className="text-xs opacity-50 group-open/output:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-2 bg-black/30 rounded-lg border border-emerald-500/20 p-3 text-xs font-mono text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                          {output}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Other agent messages (status updates, etc.)
            return (
              <div 
                key={activity.id} 
                className="group px-4 py-4 bg-[#2a2a2a] hover:bg-[#2f2f2f] transition-colors border-t border-gray-800"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-gray-700 flex items-center justify-center text-white text-lg">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${getActivityColor(activity.action)}`}>
                        {activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                    <div className="text-gray-300 text-[15px] leading-relaxed">
                      {activity.description}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          {isActive && allActivities.length > 0 && (
            <div className="group px-4 py-8 bg-[#2a2a2a] border-t border-gray-800">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-purple-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion Message - Only show if truly completed and not being resumed */}
          {research.status === 'completed' && !sending && (
            <div className="group px-4 py-8 bg-[#2a2a2a] hover:bg-[#2f2f2f] transition-colors border-t border-gray-800">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-purple-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div className="flex-1 space-y-3 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg text-green-400">✅</span>
                    <span className="font-semibold text-sm text-green-400">Research Complete</span>
                  </div>
                  <div className="text-gray-200 text-[15px] leading-relaxed">
                    Research completed successfully! Your findings are ready to view.
                  </div>
                  <Link 
                    href="/"
                    className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-white text-sm font-medium transition-colors"
                  >
                    View Research Files →
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Resuming Indicator */}
          {sending && research.status === 'completed' && (
            <div className="group px-4 py-8 bg-[#2a2a2a] border-t border-gray-800">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-blue-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm text-blue-400">Resuming Research</span>
                  </div>
                  <div className="text-gray-300 text-[15px] leading-relaxed">
                    Restarting agent with conversation history...
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-[#212121] border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Send a message to continue the conversation..."
              disabled={sending}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-[#2f2f2f] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: '52px', maxHeight: '200px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || sending}
              className="absolute right-2 bottom-2 p-2 rounded-md text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <svg className="w-5 h-5 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-gray-600">
              {research.status === 'completed' 
                ? 'Research complete. Send a message to continue the conversation.'
                : 'You can continue chatting with the agent even after stopping'}
            </p>
            {isActive && (
              <button
                onClick={handleStopResearch}
                disabled={stopping}
                className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {stopping ? 'Stopping...' : 'Stop Research'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
