/**
 * Project Metadata Component
 * Displays category and tags badges
 */

import clsx from 'clsx';
import type { ResearchMetadata } from '@/lib/types';

interface ProjectMetadataProps {
  metadata: ResearchMetadata;
  className?: string;
}

export function ProjectMetadata({ metadata, className }: ProjectMetadataProps) {
  if (!metadata.category && (!metadata.tags || metadata.tags.length === 0)) {
    return null;
  }

  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {metadata.category && (
         <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-notion-blue text-white border border-notion-blue">
           {metadata.category}
         </span>
       )}
       {metadata.tags?.map((tag) => (
         <span
           key={tag}
           className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-notion-bg-secondary text-notion-text-secondary border border-notion-border"
         >
           {tag}
         </span>
       ))}
    </div>
  );
}
