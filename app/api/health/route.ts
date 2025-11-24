/**
 * GET /api/health
 * Health check endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { scanResearchProjects } from '@/lib/server/file-scanner';
import type { HealthResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest): Promise<NextResponse<HealthResponse>> {
  try {
    const projects = await scanResearchProjects();
    const researchDir = process.env.RESEARCH_DIR || process.cwd();

    return NextResponse.json({
      status: 'ok',
      projectCount: Object.keys(projects).length,
      researchDir,
      connectedClients: 0, // Would need WebSocket tracking
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        projectCount: 0,
        researchDir: process.env.RESEARCH_DIR || process.cwd(),
        connectedClients: 0,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
