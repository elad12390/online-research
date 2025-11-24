/**
 * Document Tabs Component
 * Tab navigation for project files
 */

import clsx from 'clsx';
import type { ResearchProject } from '@/lib/types';

interface DocumentTabsProps {
  project: ResearchProject | null;
  currentFileName: string | null;
  onFileSelect: (fileName: string) => void;
}

export function DocumentTabs({ project, currentFileName, onFileSelect }: DocumentTabsProps) {
  if (!project) return null;

  return (
    <div className="flex items-center gap-0 border-b border-notion-border overflow-x-auto px-4">
      {project.files.map((fileName) => (
        <button
          key={fileName}
          onClick={() => onFileSelect(fileName)}
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all',
            currentFileName === fileName
              ? 'border-b-notion-blue text-notion-blue'
              : 'border-b-transparent text-notion-text-secondary hover:text-notion-text-primary'
          )}
        >
          {fileName}
        </button>
      ))}
    </div>
  );
}
