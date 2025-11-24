/**
 * Progress Panel Component
 * Displays research progress tracking
 */

import { useEffect, useState } from 'react';
import type { ResearchProgress } from '@/lib/types';

interface ProgressPanelProps {
  projectId: string;
  visible: boolean;
  onClose: () => void;
}

export function ProgressPanel({ projectId, visible, onClose }: ProgressPanelProps) {
  const [progress, setProgress] = useState<ResearchProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/progress`);
        if (response.ok) {
          const data = await response.json();
          const progressData = data.progress;
          setProgress(progressData);
          
          // Auto-close when research is complete
          if (progressData && progressData.percentage >= 100) {
            console.log('Research complete, auto-closing in 2 seconds');
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();

    // Poll for progress updates every 2 seconds
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval);
  }, [visible, projectId, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 max-h-96 bg-notion-bg-secondary border border-notion-border rounded-lg shadow-lg p-4 z-40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-notion-text-primary">
          Research in Progress
        </h3>
        <button
          onClick={onClose}
          className="text-notion-text-tertiary hover:text-notion-text-secondary transition-colors"
        >
          ✕
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-notion-text-secondary">Loading progress...</div>
      ) : progress ? (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-notion-text-secondary">
                {progress.currentTask || 'Processing...'}
              </span>
              <span className="text-xs font-semibold text-notion-blue">
                {progress.percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-notion-bg-primary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-notion-blue to-notion-blue-light transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Current Task Description */}
          {progress.currentTaskDescription && (
            <div className="text-xs text-notion-text-secondary border-t border-notion-border pt-3">
              <p className="mb-1 font-medium">Current task:</p>
              <p className="text-notion-text-tertiary">
                {progress.currentTaskDescription}
              </p>
            </div>
          )}

          {/* Completed Tasks */}
          {progress.completedTasks && progress.completedTasks.length > 0 && (
            <div className="text-xs text-notion-text-secondary border-t border-notion-border pt-3">
              <p className="mb-2 font-medium">Completed tasks:</p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {progress.completedTasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-notion-text-tertiary">
                    <span className="text-notion-blue mt-0.5">✓</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-notion-text-secondary">No progress data available</div>
      )}
    </div>
  );
}
