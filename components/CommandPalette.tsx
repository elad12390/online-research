/**
 * Command Palette Component
 * Cmd+K search and navigation with quick actions
 */

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

interface CommandPaletteProps {
  projects: Record<string, any>;
  onProjectSelect: (projectId: string) => void;
  onFileSelect: (projectId: string, fileName: string) => void;
}

interface SearchResult {
  type: 'project' | 'file' | 'action';
  projectId?: string;
  fileName?: string;
  title: string;
  description?: string;
  action?: () => void;
  icon?: string;
}

const QUICK_ACTIONS: SearchResult[] = [
  {
    type: 'action',
    title: 'Start New Research',
    description: 'Create a new research project',
    icon: '✨',
    action: () => {
      window.location.href = '/wizard';
    }
  },
  {
    type: 'action',
    title: 'View All Researches',
    description: 'Go to the main portal',
    icon: '📚',
    action: () => {
      window.location.href = '/';
    }
  },
  {
    type: 'action',
    title: 'Running Agents',
    description: 'Monitor active research sessions',
    icon: '⚙️',
    action: () => {
      // Scroll to research side panel or highlight it
      useStore.getState().toggleCommandPalette();
      const sidePanel = document.querySelector('[data-panel="research-side"]');
      if (sidePanel) {
        sidePanel.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },
  {
    type: 'action',
    title: 'Stop All Researches',
    description: 'Terminate all running research agents',
    icon: '⛔',
    action: async () => {
      // Show confirmation toast with action buttons
      toast('Stop all running researches?', {
        description: 'This will terminate all active research agents',
        action: {
          label: 'Stop All',
          onClick: async () => {
            try {
              const response = await fetch('/api/research');
              if (response.ok) {
                const data = await response.json();
                const researches = data.researches || [];
                
                // Stop all active researches
                const activeResearches = researches.filter((r: any) => 
                  r.status === 'running' || r.status === 'active'
                );
                
                for (const research of activeResearches) {
                  await fetch(`/api/research/${research.id}/stop`, { method: 'POST' });
                }
                
                toast.success(`Stopped ${activeResearches.length} active research(es)`);
                useStore.getState().toggleCommandPalette();
                window.location.reload();
              }
            } catch (error) {
              console.error('Error stopping researches:', error);
              toast.error('Failed to stop researches');
            }
          },
        },
        cancel: {
          label: 'Cancel',
          onClick: () => {},
        },
      });
    }
  }
];

export function CommandPalette({
  projects,
  onProjectSelect,
  onFileSelect
}: CommandPaletteProps) {
  const [isOpen, useIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen_store = useStore((state) => state.commandPaletteOpen);

  // Sync with store
  useEffect(() => {
    useIsOpen(isOpen_store);
    if (isOpen_store) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen_store]);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useStore.getState().toggleCommandPalette();
      }

      if (isOpen) {
        if (e.key === 'Escape') {
          useStore.getState().setCommandPaletteOpen(false);
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % Math.max(1, results.length));
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query]);

  const results = useMemo(() => {
    if (!query.trim()) {
      // Show quick actions when search is empty
      return QUICK_ACTIONS;
    }

    const q = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search in quick actions
    QUICK_ACTIONS.forEach((action) => {
      if (action.title.toLowerCase().includes(q) || action.description?.toLowerCase().includes(q)) {
        searchResults.push(action);
      }
    });

    // Search in projects
    Object.entries(projects).forEach(([projectId, project]) => {
      // Match project name
      if (projectId.toLowerCase().includes(q)) {
        searchResults.push({
          type: 'project',
          projectId,
          title: projectId,
          description: project.metadata?.title,
          icon: '📁'
        });
      }

      // Match files
      project.files?.forEach((fileName: string) => {
        if (fileName.toLowerCase().includes(q)) {
          searchResults.push({
            type: 'file',
            projectId,
            fileName,
            title: fileName,
            description: projectId,
            icon: '📄'
          });
        }
      });
    });

    return searchResults.slice(0, 10);
  }, [query, projects]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'action' && result.action) {
      result.action();
    } else if (result.type === 'project' && result.projectId) {
      onProjectSelect(result.projectId);
    } else if (result.type === 'file' && result.projectId && result.fileName) {
      onFileSelect(result.projectId, result.fileName);
    }
    useStore.getState().setCommandPaletteOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => useStore.getState().setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 w-full max-w-xl bg-notion-bg-secondary border border-notion-border rounded-lg shadow-lg z-50 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-notion-border">
          <div className="flex items-center gap-2">
            <span className="text-notion-text-tertiary">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search projects, files, or use quick actions..."
              className="flex-1 bg-transparent text-notion-text-primary focus:outline-none placeholder-notion-text-tertiary text-sm"
            />
            <div className="text-xs text-notion-text-tertiary">⌘K</div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, idx) => (
              <button
                key={`${result.type}:${result.projectId}:${result.fileName}`}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b border-notion-border last:border-b-0 transition-colors text-left ${
                  idx === selectedIndex ? 'bg-notion-bg-tertiary' : 'hover:bg-notion-bg-hover'
                }`}
              >
                <span className="flex-shrink-0 text-lg">
                  {result.icon || (result.type === 'project' ? '📁' : '📄')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-notion-text-primary truncate">
                    {result.title}
                  </div>
                  {result.description && (
                    <div className="text-xs text-notion-text-tertiary truncate">
                      {result.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : query ? (
          <div className="px-4 py-8 text-center">
            <p className="text-notion-text-secondary text-sm">No results found</p>
          </div>
        ) : (
          <div className="px-4 py-8">
            <p className="text-notion-text-secondary text-sm mb-2">Quick Actions</p>
            <p className="text-xs text-notion-text-tertiary">Type to search projects and files, or use the actions above to:</p>
            <ul className="mt-3 space-y-2 text-xs text-notion-text-tertiary">
              <li>✨ Start a new research project</li>
              <li>📚 Browse all research projects</li>
              <li>⚙️ Monitor running agents</li>
              <li>⛔ Stop active researches</li>
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2 border-t border-notion-border bg-notion-bg-primary text-xs text-notion-text-tertiary flex gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 bg-notion-bg-secondary rounded">↑↓</kbd> Navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-notion-bg-secondary rounded">↵</kbd> Select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-notion-bg-secondary rounded">Esc</kbd> Close
          </span>
        </div>
      </div>
    </>
  );
}
