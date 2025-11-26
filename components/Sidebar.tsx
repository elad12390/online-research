/**
 * Sidebar Component
 * Contains navigation, search, favorites, recent, and projects
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SearchBox } from './SearchBox';
import { ProjectTree } from './ProjectTree';
import { useStore, useProjects } from '@/lib/store';
import type { ResearchProject } from '@/lib/types';

interface SidebarProps {
  onProjectSelect: (projectId: string) => void;
  onFileSelect: (projectId: string, fileName: string) => void;
}

export function Sidebar({ onProjectSelect, onFileSelect }: SidebarProps) {
  const router = useRouter();
  const projects = useProjects();
  const expandedProjects = useStore((state) => state.expandedProjects);
  const currentProjectId = useStore((state) => state.currentProjectId);
  const currentFileName = useStore((state) => state.currentFileName);
  const favorites = useStore((state) => state.favorites);
  const recent = useStore((state) => state.recent);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'projects' | 'favorites' | 'recent'>(
    'projects'
  );

  const toggleProject = (projectId: string) => {
    useStore.getState().toggleProjectExpanded(projectId);
  };

  // Get favorite projects
  const favoriteItems = useMemo(() => {
    return favorites
      .map((key) => {
        const [projectId, fileName] = key.split(':');
        const project = projects[projectId];
        if (!project) return null;
        return { projectId, fileName, project };
      })
      .filter(Boolean);
  }, [favorites, projects]);

  // Get recent projects with full data
  const recentItems = useMemo(() => {
    return recent
      .map((item) => {
        const project = projects[item.projectId];
        if (!project) return null;
        return { ...item, project };
      })
      .filter(Boolean)
      .slice(0, 5);
  }, [recent, projects]);

  const handleHomeClick = () => {
    useStore.getState().setCurrentProject(null);
    useStore.getState().setCurrentFile(null);
    router.push('/');
  };

  const handleProjectDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Project deleted successfully');
        // Refresh projects
        const refreshResponse = await fetch('/api/projects');
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          useStore.getState().setProjects(data.projects);
          
          // Clear current selection if deleted project was selected
          if (currentProjectId === projectId) {
            useStore.getState().setCurrentProject(null);
            useStore.getState().setCurrentFile(null);
          }
        }
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error deleting project');
    }
  };

  return (
    <aside className="h-full w-full bg-notion-bg-secondary border-r border-notion-border flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-4 border-b border-notion-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src="/icon.png" 
            alt="Research Portal" 
            className="w-6 h-6 rounded"
          />
          <h1 className="text-lg font-semibold text-notion-text-primary">
            Research
          </h1>
        </div>
      </div>

      {/* Search */}
      <SearchBox
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search projects..."
      />

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-3 border-b border-notion-border mb-2">
          <button
            onClick={handleHomeClick}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-notion-text-primary hover:bg-notion-bg-hover transition-colors"
          >
            <span>🏠</span>
            <span>Home</span>
          </button>
        </div>

        {/* Favorites Section */}
        {favoriteItems.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setActiveSection('favorites')}
              className="w-full px-3 py-2 text-xs font-semibold text-notion-text-tertiary hover:text-notion-text-secondary transition-colors text-left"
            >
              ⭐ FAVORITES
            </button>
            {activeSection === 'favorites' && (
              <div className="space-y-0.5 px-2">
                {favoriteItems.map((item) =>
                  item ? (
                    <button
                      key={`${item.projectId}:${item.fileName}`}
                      onClick={() => {
                        onProjectSelect(item.projectId);
                        onFileSelect(item.projectId, item.fileName);
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-notion-text-secondary hover:bg-notion-bg-hover transition-colors text-left truncate"
                    >
                      <span>📄</span>
                      <span className="truncate">{item.fileName}</span>
                    </button>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Section */}
        {recentItems.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setActiveSection('recent')}
              className="w-full px-3 py-2 text-xs font-semibold text-notion-text-tertiary hover:text-notion-text-secondary transition-colors text-left"
            >
              🕐 RECENT
            </button>
            {activeSection === 'recent' && (
              <div className="space-y-0.5 px-2">
                {recentItems.map((item) =>
                  item ? (
                    <button
                      key={`${item.projectId}:${item.fileName}`}
                      onClick={() => {
                        onProjectSelect(item.projectId);
                        onFileSelect(item.projectId, item.fileName);
                      }}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm text-notion-text-secondary hover:bg-notion-bg-hover transition-colors text-left truncate"
                    >
                      <span>📄</span>
                      <span className="truncate">{item.fileName}</span>
                    </button>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {/* Projects Section */}
        <div>
          <button
            onClick={() => setActiveSection('projects')}
            className="w-full px-3 py-2 text-xs font-semibold text-notion-text-tertiary hover:text-notion-text-secondary transition-colors text-left"
          >
            📚 PROJECTS
          </button>
          {activeSection === 'projects' && (
            <ProjectTree
              projects={projects}
              expandedProjects={expandedProjects}
              currentProjectId={currentProjectId}
              currentFileName={currentFileName}
              searchQuery={searchQuery}
              onProjectClick={onProjectSelect}
              onProjectToggle={toggleProject}
              onFileClick={onFileSelect}
              onProjectDelete={handleProjectDelete}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
