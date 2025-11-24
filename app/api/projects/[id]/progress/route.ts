/**
 * GET /api/projects/[id]/progress
 * Returns the progress file for a project
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getProject } from '@/lib/server/file-scanner';
import type { ProgressResponse, ResearchProgress } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
): Promise<NextResponse<ProgressResponse | { error: string }>> {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Try to read progress file
    try {
      const progressPath = path.join(project.path, '.research-progress.json');
      const content = await readFile(progressPath, 'utf-8');
      const progress: ResearchProgress = JSON.parse(content);

      return NextResponse.json({
        projectId,
        progress,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      // No progress file exists yet
      return NextResponse.json({
        projectId,
        progress: null,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
