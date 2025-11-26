/**
 * Welcome Screen Component
 * Displayed when no project is selected
 */

import Link from 'next/link'

export function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-notion-bg-primary to-notion-bg-secondary">
      <div className="text-center max-w-md">
        <img 
          src="/logo.png" 
          alt="Research Portal" 
          className="w-24 h-24 mx-auto mb-6 rounded-xl shadow-lg"
        />
        <h1 className="text-4xl font-bold text-notion-text-primary mb-4">
          Research Portal
        </h1>
        <p className="text-lg text-notion-text-secondary mb-8">
          Select a project from the sidebar to get started
        </p>

        <div className="grid grid-cols-1 gap-4">
          <Link
            href="/wizard"
            className="bg-notion-accent hover:bg-notion-accent/90 text-white rounded-lg p-6 border border-notion-accent transition-colors"
          >
            <div className="text-2xl mb-3">🔬</div>
            <p className="text-sm font-medium">
              Start New Research
            </p>
          </Link>

          <div className="bg-notion-bg-secondary rounded-lg p-6 border border-notion-border">
            <div className="text-2xl mb-3">📚</div>
            <p className="text-sm text-notion-text-secondary">
              Browse your research projects
            </p>
          </div>

          <div className="bg-notion-bg-secondary rounded-lg p-6 border border-notion-border">
            <div className="text-2xl mb-3">🔄</div>
            <p className="text-sm text-notion-text-secondary">
              Real-time updates with auto-save
            </p>
          </div>

          <div className="bg-notion-bg-secondary rounded-lg p-6 border border-notion-border">
            <div className="text-2xl mb-3">✨</div>
            <p className="text-sm text-notion-text-secondary">
              Beautiful Notion-style design
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-notion-border text-xs text-notion-text-tertiary">
          <p>💡 Tip: Press <kbd className="px-2 py-1 bg-notion-bg-secondary rounded">⌘K</kbd> to search</p>
        </div>
      </div>
    </div>
  );
}
