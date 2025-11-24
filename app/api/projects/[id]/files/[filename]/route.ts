/**
 * GET /api/projects/[id]/files/[filename]
 * Returns the content of a specific file
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { marked } from 'marked';
import { getProject, getProjectFilePath } from '@/lib/server/file-scanner';
import type { FileContentResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Params {
  id: string;
  filename: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
): Promise<NextResponse<FileContentResponse | { error: string }>> {
  try {
    const projectId = params.id;
    const fileName = decodeURIComponent(params.filename);

    if (!projectId || !fileName) {
      return NextResponse.json(
        { error: 'Project ID and filename are required' },
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

    // Get file path and read file
    try {
      const filePath = getProjectFilePath(projectId, fileName);
      const content = await readFile(filePath, 'utf-8');

      // Convert markdown to HTML if it's a markdown file
      // For HTML files, pass through as-is
      let html = content;
      if (fileName.endsWith('.md')) {
        html = await marked(content, {
          breaks: true,
          gfm: true
        });
      } else if (fileName.endsWith('.html')) {
        // HTML files: use content as-is (already HTML)
        html = content;
      }

      return NextResponse.json({
        fileName,
        projectId,
        content,
        html,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}
