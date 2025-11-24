/**
 * GET /api/projects
 * Returns all research projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanResearchProjects } from '@/lib/server/file-scanner';
import type { ProjectsResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest): Promise<NextResponse<ProjectsResponse>> {
  try {
    const projects = await scanResearchProjects();

    return NextResponse.json({
      projects,
      count: Object.keys(projects).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        projects: {},
        count: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
