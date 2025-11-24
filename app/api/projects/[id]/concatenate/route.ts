/**
 * API Route: Concatenate all project files
 * Returns all files concatenated into a single text document
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/server/file-scanner';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const project = await getProject(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Concatenate all files
    let concatenated = '';
    
    // Add header
    concatenated += `═══════════════════════════════════════════════════════════════\n`;
    concatenated += `  ${project.metadata?.title || project.name}\n`;
    concatenated += `═══════════════════════════════════════════════════════════════\n\n`;
    
    if (project.metadata?.description) {
      concatenated += `Description: ${project.metadata.description}\n`;
    }
    if (project.metadata?.category) {
      concatenated += `Category: ${project.metadata.category}\n`;
    }
    if (project.metadata?.tags && project.metadata.tags.length > 0) {
      concatenated += `Tags: ${project.metadata.tags.join(', ')}\n`;
    }
    concatenated += `\n`;

    // Read and concatenate all files
    for (const fileName of project.files) {
      const filePath = path.join(project.path, fileName);
      
      try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) continue;

        const content = await fs.readFile(filePath, 'utf-8');
        
        concatenated += `\n\n`;
        concatenated += `═══════════════════════════════════════════════════════════════\n`;
        concatenated += `  FILE: ${fileName}\n`;
        concatenated += `═══════════════════════════════════════════════════════════════\n\n`;
        
        // For HTML files, strip tags for readability in plain text
        if (fileName.endsWith('.html')) {
          const textContent = content
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          concatenated += textContent;
        } else {
          concatenated += content;
        }
        
        concatenated += `\n`;
      } catch (err) {
        console.error(`Error reading file ${fileName}:`, err);
        concatenated += `[Error reading file: ${fileName}]\n`;
      }
    }

    // Add footer
    concatenated += `\n\n`;
    concatenated += `═══════════════════════════════════════════════════════════════\n`;
    concatenated += `  End of Research\n`;
    concatenated += `═══════════════════════════════════════════════════════════════\n`;

    return new NextResponse(concatenated, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${projectId}.txt"`
      }
    });
  } catch (error) {
    console.error('Error concatenating project:', error);
    return NextResponse.json(
      { error: 'Failed to concatenate project files' },
      { status: 500 }
    );
  }
}
