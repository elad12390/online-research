/**
 * Document Header Component
 * Displays project info and metadata
 */

import { ProjectMetadata } from './ProjectMetadata';
import type { ResearchProject } from '@/lib/types';
import Link from 'next/link';
import { toast } from 'sonner';

interface DocumentHeaderProps {
  project: ResearchProject | null;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function DocumentHeader({
  project,
  isFavorite = false,
  onToggleFavorite
}: DocumentHeaderProps) {
  if (!project) return null;

  return (
    <div className="border-b border-notion-border px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-notion-text-primary mb-2">
            {project.metadata.title || project.name}
          </h1>
          <ProjectMetadata metadata={project.metadata} className="mb-3" />
          {project.progress && (
            <div className="text-xs text-notion-text-tertiary">
              Progress: {project.progress.percentage}%
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          {/* Copy all files to clipboard button */}
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/projects/${project.id}/concatenate`);
                const text = await response.text();
                await navigator.clipboard.writeText(text);
                toast.success('Research copied to clipboard!');
              } catch (error) {
                console.error('Failed to copy:', error);
                toast.error('Failed to copy to clipboard');
              }
            }}
            className="px-3 py-1.5 bg-notion-bg-tertiary hover:bg-notion-bg-hover text-notion-text-primary text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 border border-notion-border"
            title="Copy all files to clipboard as text"
          >
            <span>📄</span> Copy All
          </button>

          {/* Download as ZIP button */}
          <a
            href={`/api/projects/${project.id}/download`}
            download
            className="px-3 py-1.5 bg-notion-bg-tertiary hover:bg-notion-bg-hover text-notion-text-primary text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 border border-notion-border"
            title="Download research as ZIP file"
          >
            <span>📦</span> ZIP
          </a>

          {project.researchId && (
            <Link 
              href={`/research/${project.researchId}`}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
              title="Continue chatting with the research agent"
            >
              <span>💬</span> Chat
            </Link>
          )}

          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className="text-2xl hover:opacity-80 transition-opacity flex-shrink-0"
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '⭐' : '☆'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
