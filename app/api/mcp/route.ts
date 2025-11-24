/**
 * MCP (Model Context Protocol) SSE Server
 * Exposes research database to AI agents via SSE
 */

import { NextRequest } from 'next/server';
import { scanResearchProjects, getProjectFilePath } from '@/lib/server/file-scanner';
import { readFile } from 'fs/promises';

// Force dynamic rendering - don't try to pre-render at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// MCP JSON-RPC 2.0 Message Types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

/**
 * SSE Stream - Server to Client Messages
 * GET /api/mcp
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const welcomeMsg: JsonRpcNotification = {
        jsonrpc: '2.0',
        method: 'server/connected',
        params: {
          serverInfo: {
            name: 'Research Portal MCP Server',
            version: '1.0.0',
            capabilities: {
              resources: true,
              tools: false,
              prompts: false
            }
          }
        }
      };

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(welcomeMsg)}\n\n`));

      // Keep alive interval
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 15000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

/**
 * HTTP POST - Client to Server Messages
 * POST /api/mcp
 */
export async function POST(request: NextRequest) {
  try {
    const rpcRequest: JsonRpcRequest = await request.json();

    // Validate JSON-RPC request
    if (rpcRequest.jsonrpc !== '2.0') {
      return sendJsonRpcError(rpcRequest.id, -32600, 'Invalid Request: jsonrpc must be "2.0"');
    }

    // Route method calls
    switch (rpcRequest.method) {
      case 'resources/list':
        return handleResourcesList(rpcRequest);

      case 'resources/read':
        return handleResourcesRead(rpcRequest);

      case 'resources/search':
        return handleResourcesSearch(rpcRequest);

      default:
        return sendJsonRpcError(rpcRequest.id, -32601, `Method not found: ${rpcRequest.method}`);
    }
  } catch (error) {
    console.error('MCP Request Error:', error);
    return sendJsonRpcError(null, -32700, 'Parse error');
  }
}

/**
 * List all research resources
 */
async function handleResourcesList(rpcRequest: JsonRpcRequest) {
  try {
    const projects = await scanResearchProjects();

    const resources = Object.values(projects).flatMap(project => {
      return project.files.map(file => ({
        uri: `research://${project.id}/${file}`,
        name: `${project.metadata.title || project.name} - ${file}`,
        description: `Research file from project: ${project.name}`,
        mimeType: 'text/markdown',
        metadata: {
          projectId: project.id,
          projectName: project.name,
          fileName: file,
          category: project.metadata.category,
          tags: project.metadata.tags,
          createdAt: project.createdAt,
          modifiedAt: project.modifiedAt
        }
      }));
    });

    return sendJsonRpcSuccess(rpcRequest.id, {
      resources,
      nextCursor: null
    });
  } catch (error) {
    console.error('Error listing resources:', error);
    return sendJsonRpcError(rpcRequest.id, -32603, 'Internal error');
  }
}

/**
 * Read a specific research resource
 */
async function handleResourcesRead(rpcRequest: JsonRpcRequest) {
  try {
    const { uri } = rpcRequest.params;

    if (!uri || typeof uri !== 'string') {
      return sendJsonRpcError(rpcRequest.id, -32602, 'Invalid params: uri required');
    }

    // Parse URI: research://project-id/file-name.md
    const match = uri.match(/^research:\/\/([^/]+)\/(.+)$/);
    if (!match) {
      return sendJsonRpcError(rpcRequest.id, -32602, 'Invalid URI format');
    }

    const [, projectId, fileName] = match;

    // Read file
    const filePath = getProjectFilePath(projectId, fileName);
    const content = await readFile(filePath, 'utf-8');

    return sendJsonRpcSuccess(rpcRequest.id, {
      contents: [{
        uri,
        mimeType: 'text/markdown',
        text: content
      }]
    });
  } catch (error) {
    console.error('Error reading resource:', error);
    return sendJsonRpcError(rpcRequest.id, -32603, 'Internal error');
  }
}

/**
 * Search research resources
 */
async function handleResourcesSearch(rpcRequest: JsonRpcRequest) {
  try {
    const { query, category, tags } = rpcRequest.params || {};
    const projects = await scanResearchProjects();

    let resources = Object.values(projects).flatMap(project => {
      return project.files.map(file => ({
        uri: `research://${project.id}/${file}`,
        name: `${project.metadata.title || project.name} - ${file}`,
        description: `Research file from project: ${project.name}`,
        mimeType: 'text/markdown',
        metadata: {
          projectId: project.id,
          projectName: project.name,
          fileName: file,
          category: project.metadata.category,
          tags: project.metadata.tags,
          createdAt: project.createdAt,
          modifiedAt: project.modifiedAt
        }
      }));
    });

    // Filter by category
    if (category) {
      resources = resources.filter(r => 
        r.metadata.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Filter by tags
    if (tags && Array.isArray(tags)) {
      resources = resources.filter(r => 
        tags.some(tag => 
          r.metadata.tags?.some((t: string) => 
            t.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    // Filter by query (name/description search)
    if (query) {
      const q = query.toLowerCase();
      resources = resources.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q)
      );
    }

    return sendJsonRpcSuccess(rpcRequest.id, {
      resources,
      nextCursor: null
    });
  } catch (error) {
    console.error('Error searching resources:', error);
    return sendJsonRpcError(rpcRequest.id, -32603, 'Internal error');
  }
}

/**
 * Send JSON-RPC success response
 */
function sendJsonRpcSuccess(id: string | number | null, result: any) {
  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    id: id ?? 0,
    result
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Send JSON-RPC error response
 */
function sendJsonRpcError(id: string | number | null, code: number, message: string, data?: any) {
  const response: JsonRpcResponse = {
    jsonrpc: '2.0',
    id: id ?? 0,
    error: {
      code,
      message,
      data
    }
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
    status: 200 // JSON-RPC errors use 200 status
  });
}
