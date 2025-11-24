'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import './ResearchSidePanel.css'

interface Agent {
  id: string
  researchId: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: number
  completedAt?: number
}

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
}

interface ResearchData {
  researches: Research[]
  stats: {
    researches: { total: number; completed: number }
    agents: { total: number; completed: number }
    activities: number
  }
  recentActivities: Activity[]
}

export const ResearchSidePanel: React.FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'agents' | 'history'>('agents')
  const [data, setData] = useState<ResearchData>({
    researches: [],
    stats: {
      researches: { total: 0, completed: 0 },
      agents: { total: 0, completed: 0 },
      activities: 0,
    },
    recentActivities: [],
  })
  const [loading, setLoading] = useState(true)

  // Fetch data every 3 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/research')
        if (!response.ok) throw new Error('Failed to fetch research data')
        const json = await response.json()
        setData(json)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch research data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 3000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
      case 'running':
        return '⏳'
      case 'in_progress':
        return '⏳'
      case 'pending':
        return '⏸️'
      default:
        return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'running':
      case 'in_progress':
        return 'text-yellow-600'
      case 'pending':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  const handleDeleteResearch = async (researchId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    
    toast('Delete this research project?', {
      description: 'This will delete all files and cannot be undone.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const response = await fetch(`/api/research/${researchId}`, {
              method: 'DELETE',
            })

            if (response.ok) {
              toast.success('Research project deleted')
              // Refresh data
              const refreshResponse = await fetch('/api/research')
              if (refreshResponse.ok) {
                const json = await refreshResponse.json()
                setData(json)
              }
            } else {
              toast.error('Failed to delete research project')
            }
          } catch (error) {
            console.error('Error deleting research:', error)
            toast.error('Error deleting research project')
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    })
  }

    const activeAgents = data.researches
      .filter((r) => r.status === 'pending' || r.status === 'in_progress')

    if (loading) {
     return (
       <div className="research-side-panel">
         <div className="loading">Loading research data...</div>
       </div>
     )
   }

   return (
     <div className="research-side-panel">
       {/* Header */}
       <div className="panel-header">
         <h2>🔬 Research Hub</h2>
         <div className="stat-badges">
           <span className="badge">{data.stats.researches.total} Total</span>
           <span className="badge completed">{data.stats.researches.completed} Done</span>
         </div>
       </div>

       {/* Tabs */}
       <div className="panel-tabs">
         <button
           className={`tab ${activeTab === 'agents' ? 'active' : ''}`}
           onClick={() => setActiveTab('agents')}
         >
           🤖 Active Agents
           {activeAgents.length > 0 && (
             <span className="badge-small">{activeAgents.length}</span>
           )}
         </button>
         <button
           className={`tab ${activeTab === 'history' ? 'active' : ''}`}
           onClick={() => setActiveTab('history')}
         >
           📚 History
         </button>
       </div>

       {/* Content */}
       <div className="panel-content">
          {activeTab === 'agents' ? (
            <>
              {activeAgents.length === 0 ? (
                <div className="empty-state">
                  <p>No active research projects</p>
                  <p className="small">Start a new research using the wizard</p>
                </div>
              ) : (
                <div className="agents-list">
                  <h4 className="section-title">Active Research</h4>
                  {activeAgents.map((research) => (
                    <div key={research.id} className="research-group">
                      <div className="research-header">
                        <h4>{research.topic}</h4>
                        <span className={`status ${getStatusColor(research.status)}`}>
                          {getStatusIcon(research.status)} {research.status}
                        </span>
                      </div>

                      <div className="research-meta">
                        <p>{formatDate(research.createdAt)}</p>
                      </div>

                      <div className="research-actions">
                        <a href={`/research/${research.id}`} className="link">
                          📊 View Details
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
          <>
            {/* History Tab */}
            <div className="history-container">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{data.stats.researches.total}</div>
                  <div className="stat-label">Total Projects</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{data.stats.agents.total}</div>
                  <div className="stat-label">Agents Spawned</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{data.stats.activities}</div>
                  <div className="stat-label">Activities</div>
                </div>
              </div>

              <h4 className="section-title">Recent Research Projects</h4>
              <div className="researches-list">
                {data.researches.slice(0, 8).map((research) => (
                  <div 
                    key={research.id} 
                    className="research-row"
                    onClick={() => router.push(`/research/${research.id}`)}
                  >
                    <div className="research-info">
                      <span className={`status-icon ${getStatusColor(research.status)}`}>
                        {getStatusIcon(research.status)}
                      </span>
                      <div className="research-details">
                        <p className="research-name">{research.topic}</p>
                        <p className="research-date">
                          {formatDate(research.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteResearch(research.id, e)}
                      title="Delete research"
                      aria-label="Delete research"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <h4 className="section-title">Recent Activities</h4>
              <div className="activities-list">
                {data.recentActivities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <span className="activity-time">{formatTime(activity.timestamp)}</span>
                    <span className="activity-action">{activity.action}</span>
                    <p className="activity-desc">{activity.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="panel-footer">
        <p className="small">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

export default ResearchSidePanel
