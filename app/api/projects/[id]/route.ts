/**
 * GET /api/projects/[id]
 * Returns a specific project
 * 
 * DELETE /api/projects/[id]
 * Deletes a project and all its files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProject, deleteProject } from '@/lib/server/file-scanner';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse> {
  try {
    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const project = await getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      project,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse> {
  try {
    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteProject(projectId);

    if (!success) {
      return NextResponse.json(
        { error: 'Project not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
