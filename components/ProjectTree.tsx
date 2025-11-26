/**
 * Project Tree Component
 * Renders the hierarchical project/file tree with drag-and-drop reordering
 */

import { useMemo } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ResearchProject } from '@/lib/types';
import { useStore } from '@/lib/store';

/**
 * Format time remaining from ISO timestamp
 */
function formatTimeRemaining(estimatedCompletion: string): string {
  try {
    const now = Date.now();
    const completionTime = new Date(estimatedCompletion).getTime();
    const remainingMs = completionTime - now;
    
    if (remainingMs <= 0) {
      return 'finishing...';
    }
    
    const minutes = Math.ceil(remainingMs / 60000);
    
    if (minutes < 1) {
      return '< 1m';
    } else if (minutes < 60) {
      return `~${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
    }
  } catch {
    return '';
  }
}

interface ProjectTreeProps {
  projects: Record<string, ResearchProject>;
  expandedProjects: Set<string>;
  currentProjectId: string | null;
  currentFileName: string | null;
  searchQuery: string;
  onProjectClick: (projectId: string) => void;
  onProjectToggle: (projectId: string) => void;
  onFileClick: (projectId: string, fileName: string) => void;
  onProjectDelete?: (projectId: string) => void;
}

interface SortableProjectItemProps {
  projectId: string;
  project: ResearchProject;
  isExpanded: boolean;
  isActive: boolean;
  currentFileName: string | null;
  onProjectClick: (projectId: string) => void;
  onProjectToggle: (projectId: string) => void;
  onFileClick: (projectId: string, fileName: string) => void;
  onProjectDelete?: (projectId: string) => void;
}

function SortableProjectItem({
  projectId,
  project,
  isExpanded,
  isActive,
  currentFileName,
  onProjectClick,
  onProjectToggle,
  onFileClick,
  onProjectDelete,
}: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: projectId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-0.5">
      {/* Project Item */}
      <div
        className={clsx(
          'group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          isActive
            ? 'bg-notion-bg-tertiary text-notion-text-primary'
            : 'hover:bg-notion-bg-hover text-notion-text-primary'
        )}
        onClick={() => onProjectClick(projectId)}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-notion-text-secondary hover:text-notion-text-primary transition-colors cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs">⋮⋮</span>
        </button>

        {/* Toggle Arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProjectToggle(projectId);
          }}
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-notion-text-secondary hover:text-notion-text-primary transition-colors"
        >
          <span className={clsx('text-xs transition-transform', !isExpanded && '-rotate-90')}>
            ▼
          </span>
        </button>

        {/* Project Icon & Name */}
        <span className="flex-shrink-0 text-sm">📁</span>
        <div className="flex-1 flex flex-col min-w-0">
          <span className="text-sm font-medium truncate" title={project.name}>
            {project.name}
          </span>
          
          {/* Progress indicator */}
          {project.progress && project.progress.percentage < 100 && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex-1 h-1 bg-notion-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-notion-blue transition-all duration-300"
                  style={{ width: `${project.progress.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-notion-text-tertiary whitespace-nowrap">
                {project.progress.percentage}%
              </span>
            </div>
          )}
          
          {/* Current task - only show if not completed */}
          {project.progress && project.progress.percentage < 100 && project.progress.currentTask && (
            <span className="text-[10px] text-notion-text-tertiary truncate mt-0.5">
              {project.progress.currentTask}
            </span>
          )}
          
          {/* Time remaining estimate */}
          {project.progress && project.progress.percentage < 100 && project.progress.estimatedCompletion && (
            <span className="text-[10px] text-notion-text-tertiary truncate">
              ⏱️ {formatTimeRemaining(project.progress.estimatedCompletion)}
            </span>
          )}
        </div>
        
        {/* Delete Button */}
        {onProjectDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast(`Delete project "${project.name}"?`, {
                description: 'This will delete all files and cannot be undone.',
                action: {
                  label: 'Delete',
                  onClick: () => onProjectDelete(projectId),
                },
                cancel: {
                  label: 'Cancel',
                  onClick: () => {},
                },
              });
            }}
            className="flex-shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 text-lg transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30 rounded px-1"
            title="Delete project"
            aria-label="Delete project"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Files */}
      {isExpanded && (
        <div className="space-y-0.5 ml-6">
          {project.files.map((fileName) => (
            <div
              key={fileName}
              className={clsx(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
                isActive && currentFileName === fileName
                  ? 'bg-notion-blue text-white font-medium'
                  : 'text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text-primary'
              )}
              onClick={() => onFileClick(projectId, fileName)}
            >
              <span className="flex-shrink-0">📄</span>
              <span className="flex-1 truncate">{fileName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectTree({
  projects,
  expandedProjects,
  currentProjectId,
  currentFileName,
  searchQuery,
  onProjectClick,
  onProjectToggle,
  onFileClick,
  onProjectDelete
}: ProjectTreeProps) {
  const projectOrder = useStore((state) => state.projectOrder);
  const setProjectOrder = useStore((state) => state.setProjectOrder);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort projects by custom order
  const sortedProjectIds = useMemo(() => {
    const allProjectIds = Object.keys(projects);
    
    // Filter search if needed
    let filteredIds = allProjectIds;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredIds = allProjectIds.filter((id) => {
        const project = projects[id];
        // Match project name
        if (id.toLowerCase().includes(query)) return true;
        // Match metadata
        if (project.metadata.title?.toLowerCase().includes(query)) return true;
        if (project.metadata.tags?.some((t) => t.toLowerCase().includes(query))) return true;
        // Match file names
        if (project.files.some((f) => f.toLowerCase().includes(query))) return true;
        return false;
      });
    }

    // Sort by custom order
    const orderMap = new Map(projectOrder.map((id, index) => [id, index]));
    return filteredIds.sort((a, b) => {
      const indexA = orderMap.get(a) ?? Infinity;
      const indexB = orderMap.get(b) ?? Infinity;
      return indexA - indexB;
    });
  }, [projects, projectOrder, searchQuery]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedProjectIds.indexOf(active.id as string);
      const newIndex = sortedProjectIds.indexOf(over.id as string);

      const newOrder = arrayMove(sortedProjectIds, oldIndex, newIndex);
      
      // Update the full order (including projects not currently visible)
      const updatedOrder = [
        ...newOrder,
        ...projectOrder.filter(id => !newOrder.includes(id))
      ];
      
      setProjectOrder(updatedOrder);
    }
  };

  if (sortedProjectIds.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-sm text-notion-text-tertiary">
          {searchQuery ? 'No projects found' : 'No projects'}
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedProjectIds}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1 px-2 py-2">
          {sortedProjectIds.map((projectId) => {
            const project = projects[projectId];
            const isExpanded = expandedProjects.has(projectId);
            const isActive = currentProjectId === projectId;

            return (
              <SortableProjectItem
                key={projectId}
                projectId={projectId}
                project={project}
                isExpanded={isExpanded}
                isActive={isActive}
                currentFileName={currentFileName}
                onProjectClick={onProjectClick}
                onProjectToggle={onProjectToggle}
                onFileClick={onFileClick}
                onProjectDelete={onProjectDelete}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
