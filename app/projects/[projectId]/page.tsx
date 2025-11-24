/**
 * Dynamic Project Page
 * Route: /projects/[projectId]
 * Redirects to README.md or first file
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = decodeURIComponent(params.projectId as string);
  const projects = useStore((state) => state.projects);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch projects if not loaded
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
      }
    };

    if (mounted && Object.keys(projects).length === 0) {
      fetchProjects();
    }
  }, [mounted, projects]);

  // Redirect to first file
  useEffect(() => {
    if (mounted && projects[projectId]) {
      const project = projects[projectId];
      const readmeFile = project.files.find((f) => f === 'README.md');
      const fileToLoad = readmeFile || project.files[0];
      
      if (fileToLoad) {
        router.replace(`/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileToLoad)}`);
      }
    }
  }, [mounted, projectId, projects, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-notion-bg-primary">
      <div className="text-notion-text-secondary">Loading project...</div>
    </div>
  );
}
