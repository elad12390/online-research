/**
 * API Route: Download project as ZIP
 * Returns all project files as a ZIP archive
 */

import { NextResponse } from 'next/server';
import { getProject } from '@/lib/server/file-scanner';
import archiver from 'archiver';

export async function GET(
  _request: Request,
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

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create a readable stream from the archive
    const chunks: Uint8Array[] = [];
    
    archive.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk);
    });

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      archive.on('error', reject);
    });

    // Add project directory to archive
    archive.directory(project.path, project.name);

    // Finalize the archive
    await archive.finalize();

    // Wait for all data to be written
    const zipBuffer = await archivePromise;

    // Return ZIP file as Uint8Array
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectId}.zip"`,
        'Content-Length': zipBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error creating ZIP:', error);
    return NextResponse.json(
      { error: 'Failed to create ZIP archive' },
      { status: 500 }
    );
  }
}
