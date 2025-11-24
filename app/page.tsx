/**
 * Main Page Component
 * Root page for the Research Portal
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sidebar } from '@/components/Sidebar';
import { DocumentView } from '@/components/DocumentView';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { CommandPalette } from '@/components/CommandPalette';
import { ProgressPanel } from '@/components/ProgressPanel';
import { ResearchSidePanel } from '@/components/ResearchSidePanel';
import { useStore } from '@/lib/store';
import type { ResearchProject } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [progressPanelClosed, setProgressPanelClosed] = useState(false);

  // Store selectors
  const projects = useStore((state) => state.projects);
  const currentProjectId = useStore((state) => state.currentProjectId);
  const currentFileName = useStore((state) => state.currentFileName);
  const favorites = useStore((state) => state.favorites);
  const sidebarOpen = useStore((state) => state.sidebarOpen);

  // Fetch projects on mount
  useEffect(() => {
    setMounted(true);

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

    fetchProjects();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchProjects, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleProjectSelect = (projectId: string) => {
    const project = projects[projectId];
    if (project && project.files.length > 0) {
      const readmeFile = project.files.find((f) => f === 'README.md');
      const fileToLoad = readmeFile || project.files[0];
      
      // Navigate to the project file route
      router.push(`/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileToLoad)}`);
    }
  };

  const handleFileSelect = (projectId: string, fileName: string) => {
    // Navigate to the specific file route
    router.push(`/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileName)}`);
  };

  const handleToggleFavorite = (projectId: string, fileName: string) => {
    useStore.getState().toggleFavorite(projectId, fileName);
  };

  const handleHomeClick = () => {
    useStore.getState().setCurrentProject(null);
    useStore.getState().setCurrentFile(null);
    router.push('/');
  };

  if (!mounted) {
    return null;
  }

  const currentProject = currentProjectId ? projects[currentProjectId] : null;

  return (
    <div className="h-screen bg-notion-bg-primary">
      <PanelGroup direction="horizontal"  autoSaveId="main-layout">
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
            ) : currentProject && currentFileName ? (
              <DocumentView
                project={currentProject}
                fileName={currentFileName}
                onFileSelect={(file) => handleFileSelect(currentProjectId!, file)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favorites.includes(`${currentProjectId}:${currentFileName}`)}
              />
            ) : (
              <WelcomeScreen />
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
