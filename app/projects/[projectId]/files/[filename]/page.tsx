/**
 * Dynamic Project File Page
 * Route: /projects/[projectId]/files/[filename]
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sidebar } from '@/components/Sidebar';
import { DocumentView } from '@/components/DocumentView';
import { CommandPalette } from '@/components/CommandPalette';
import { ProgressPanel } from '@/components/ProgressPanel';
import { ResearchSidePanel } from '@/components/ResearchSidePanel';
import { useStore, useProjects } from '@/lib/store';

export default function ProjectFilePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = decodeURIComponent(params.projectId as string);
  const filename = decodeURIComponent(params.filename as string);
  
  const projects = useProjects();
  const currentProjectId = useStore((state) => state.currentProjectId);
  const currentFileName = useStore((state) => state.currentFileName);
  const favorites = useStore((state) => state.favorites);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progressPanelClosed, setProgressPanelClosed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          useStore.getState().setProjects(data.projects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchProjects();
      
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchProjects, 5000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  // Sync URL params to store
  useEffect(() => {
    if (projectId && filename) {
      useStore.getState().setCurrentProject(projectId);
      useStore.getState().setCurrentFile(filename);
      
      // Add to recent
      useStore.getState().addToRecent(projectId, filename);
    }
  }, [projectId, filename]);

  // Handler for navigation - updates URL
  const handleProjectSelect = (newProjectId: string) => {
    useStore.getState().toggleProjectExpanded(newProjectId);
    
    const project = projects[newProjectId];
    if (project && project.files.length > 0) {
      const readmeFile = project.files.find((f) => f === 'README.md');
      const fileToLoad = readmeFile || project.files[0];
      router.push(`/projects/${encodeURIComponent(newProjectId)}/files/${encodeURIComponent(fileToLoad)}`);
    }
  };

  const handleFileSelect = (newProjectId: string, newFileName: string) => {
    router.push(`/projects/${encodeURIComponent(newProjectId)}/files/${encodeURIComponent(newFileName)}`);
  };

  const handleToggleFavorite = (projectId: string, fileName: string) => {
    useStore.getState().toggleFavorite(projectId, fileName);
  };

  if (!mounted) {
    return null;
  }

  const currentProject = projects[projectId];

  return (
    <div className="h-screen bg-notion-bg-primary">
      <PanelGroup direction="horizontal">
        {/* Left Sidebar */}
        <Panel defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full w-full overflow-hidden">
            <Sidebar
              onProjectSelect={handleProjectSelect}
              onFileSelect={handleFileSelect}
            />
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-notion-border hover:bg-blue-500 transition-colors cursor-col-resize" />

        {/* Main Content */}
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-notion-text-secondary">Loading projects...</div>
              </div>
            ) : currentProject && filename ? (
              <DocumentView
                project={currentProject}
                fileName={filename}
                onFileSelect={(file) => handleFileSelect(projectId, file)}
                onToggleFavorite={(pid, fname) => handleToggleFavorite(pid, fname)}
                isFavorite={favorites.includes(`${projectId}:${filename}`)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-notion-text-secondary">Project or file not found</div>
              </div>
            )}
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-1 bg-notion-border hover:bg-blue-500 transition-colors cursor-col-resize" />

        {/* Right Side Panel */}
        <Panel defaultSize={20} minSize={15} maxSize={35}>
          <div className="h-full w-full overflow-hidden">
            <ResearchSidePanel />
          </div>
        </Panel>
      </PanelGroup>

      {/* Progress Panel (floating) */}
      {currentProjectId && (
        <ProgressPanel
          projectId={currentProjectId}
          visible={!progressPanelClosed && !!currentProject?.progress}
          onClose={() => {
            console.log('Progress panel closed by user');
            setProgressPanelClosed(true);
          }}
        />
      )}

      {/* Command Palette */}
      <CommandPalette 
        projects={projects}
        onProjectSelect={handleProjectSelect}
        onFileSelect={handleFileSelect}
      />
    </div>
  );
}
