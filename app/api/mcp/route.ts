/**
 * MCP (Model Context Protocol) Server
 * Implements both SSE (GET) and message handling (POST) endpoints
 * 
 * Usage:
 * - GET /api/mcp - Establishes SSE connection, returns endpoint URL with sessionId
 * - POST /api/mcp?sessionId=xxx - Send JSON-RPC messages
 * 
 * For Claude Desktop or other MCP clients, configure:
 * {
 *   "mcpServers": {
 *     "research-portal": {
 *       "url": "http://localhost:3000/api/mcp"
 *     }
 *   }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { scanResearchProjects, getProjectFilePath, getProject } from "@/lib/server/file-scanner";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Session storage for SSE connections
interface Session {
  id: string;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
  initialized: boolean;
}

const sessions = new Map<string, Session>();

// Server info
const SERVER_INFO = {
  name: "research-portal",
  version: "1.0.0",
  protocolVersion: "2024-11-05"
};

// Available tools
const TOOLS = [
  {
    name: "list_research_projects",
    description: "List all research projects in the portal with their metadata, categories, and tags",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional: Filter by category" },
        tag: { type: "string", description: "Optional: Filter by tag" }
      }
    }
  },
  {
    name: "get_project_details",
    description: "Get detailed information about a specific research project including all its files",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The project ID (folder name)" }
      },
      required: ["projectId"]
    }
  },
  {
    name: "read_research_file",
    description: "Read the content of a specific file from a research project",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "The project ID (folder name)" },
        fileName: { type: "string", description: "The file name (e.g., 'README.md', 'index.html')" }
      },
      required: ["projectId", "fileName"]
    }
  },
  {
    name: "search_research",
    description: "Search across all research projects by query string, category, or tags",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query to match against project names and descriptions" },
        category: { type: "string", description: "Filter by category" },
        tags: { type: "array", items: { type: "string" }, description: "Filter by tags (matches any)" }
      }
    }
  }
];

/**
 * Handle tool calls
 */
async function handleToolCall(name: string, args: Record<string, unknown>): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case "list_research_projects": {
      const projects = await scanResearchProjects();
      let projectList = Object.values(projects);

      if (args.category) {
        projectList = projectList.filter(p =>
          p.metadata.category?.toLowerCase().includes((args.category as string).toLowerCase())
        );
      }

      if (args.tag) {
        projectList = projectList.filter(p =>
          p.metadata.tags?.some(t =>
            t.toLowerCase().includes((args.tag as string).toLowerCase())
          )
        );
      }

      const result = projectList.map(p => ({
        id: p.id,
        name: p.metadata.title || p.name,
        category: p.metadata.category || "Uncategorized",
        tags: p.metadata.tags || [],
        description: p.metadata.description || "",
        files: p.files,
        createdAt: p.createdAt,
        modifiedAt: p.modifiedAt
      }));

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "get_project_details": {
      const projectId = args.projectId as string;
      if (!projectId) {
        return { content: [{ type: "text", text: "Error: projectId is required" }], isError: true };
      }

      const project = await getProject(projectId);
      if (!project) {
        return { content: [{ type: "text", text: `Error: Project not found: ${projectId}` }], isError: true };
      }

      const result = {
        id: project.id,
        name: project.metadata.title || project.name,
        path: project.path,
        category: project.metadata.category,
        tags: project.metadata.tags,
        description: project.metadata.description,
        summary: project.metadata.summary,
        files: project.files,
        progress: project.progress,
        createdAt: project.createdAt,
        modifiedAt: project.modifiedAt
      };

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    case "read_research_file": {
      const projectId = args.projectId as string;
      const fileName = args.fileName as string;

      if (!projectId || !fileName) {
        return { content: [{ type: "text", text: "Error: projectId and fileName are required" }], isError: true };
      }

      try {
        const filePath = getProjectFilePath(projectId, fileName);
        const content = await readFile(filePath, "utf-8");
        return { content: [{ type: "text", text: content }] };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error reading file: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true
        };
      }
    }

    case "search_research": {
      const projects = await scanResearchProjects();
      let projectList = Object.values(projects);

      const query = args.query as string | undefined;
      const category = args.category as string | undefined;
      const tags = args.tags as string[] | undefined;

      if (query) {
        const q = query.toLowerCase();
        projectList = projectList.filter(p => {
          const name = (p.metadata.title || p.name).toLowerCase();
          const desc = (p.metadata.description || "").toLowerCase();
          const summary = (p.metadata.summary || "").toLowerCase();
          return name.includes(q) || desc.includes(q) || summary.includes(q);
        });
      }

      if (category) {
        projectList = projectList.filter(p =>
          p.metadata.category?.toLowerCase().includes(category.toLowerCase())
        );
      }

      if (tags && tags.length > 0) {
        projectList = projectList.filter(p =>
          tags.some(tag =>
            p.metadata.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase()))
          )
        );
      }

      const result = projectList.map(p => ({
        id: p.id,
        name: p.metadata.title || p.name,
        category: p.metadata.category || "Uncategorized",
        tags: p.metadata.tags || [],
        description: p.metadata.description || "",
        files: p.files
      }));

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
}

/**
 * Process JSON-RPC request and return response
 */
async function processRequest(request: { jsonrpc: string; id?: string | number; method: string; params?: unknown }): Promise<unknown> {
  const { method, params, id } = request;

  switch (method) {
    case "initialize": {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: SERVER_INFO.protocolVersion,
          serverInfo: {
            name: SERVER_INFO.name,
            version: SERVER_INFO.version
          },
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false }
          }
        }
      };
    }

    case "notifications/initialized": {
      // No response needed for notifications
      return null;
    }

    case "tools/list": {
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS }
      };
    }

    case "tools/call": {
      const p = params as { name: string; arguments?: Record<string, unknown> };
      const result = await handleToolCall(p.name, p.arguments || {});
      return {
        jsonrpc: "2.0",
        id,
        result
      };
    }

    case "resources/list": {
      const projects = await scanResearchProjects();
      const resources = Object.values(projects).flatMap(project =>
        project.files.map(file => ({
          uri: `research://${project.id}/${file}`,
          name: `${project.metadata.title || project.name} - ${file}`,
          description: `Research file from project: ${project.name}`,
          mimeType: file.endsWith(".html") ? "text/html" : "text/markdown"
        }))
      );

      return {
        jsonrpc: "2.0",
        id,
        result: { resources }
      };
    }

    case "resources/read": {
      const p = params as { uri: string };
      const match = p.uri.match(/^research:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: `Invalid URI format: ${p.uri}` }
        };
      }

      const [, projectId, fileName] = match;
      try {
        const filePath = getProjectFilePath(projectId, fileName);
        const content = await readFile(filePath, "utf-8");
        return {
          jsonrpc: "2.0",
          id,
          result: {
            contents: [{
              uri: p.uri,
              mimeType: fileName.endsWith(".html") ? "text/html" : "text/markdown",
              text: content
            }]
          }
        };
      } catch (error) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32603, message: error instanceof Error ? error.message : "Unknown error" }
        };
      }
    }

    case "ping": {
      return { jsonrpc: "2.0", id, result: {} };
    }

    default: {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
    }
  }
}

/**
 * GET /api/mcp - Establish SSE connection
 */
export async function GET(request: NextRequest) {
  console.log("[MCP] New SSE connection request");

  const sessionId = crypto.randomUUID();
  const messagesUrl = `/api/mcp?sessionId=${sessionId}`;
  const encoder = new TextEncoder();

  // Use ReadableStream with controller for proper SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store session with controller-based writer
      const session: Session = {
        id: sessionId,
        writer: {
          write: async (data: Uint8Array) => {
            controller.enqueue(data);
          },
          close: async () => {
            controller.close();
          }
        } as unknown as WritableStreamDefaultWriter<Uint8Array>,
        encoder,
        initialized: false
      };
      sessions.set(sessionId, session);

      // Send endpoint event immediately
      const endpointEvent = `event: endpoint\ndata: ${messagesUrl}\n\n`;
      controller.enqueue(encoder.encode(endpointEvent));
      console.log(`[MCP] SSE connection established, session: ${sessionId}`);

      // Keep alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Cleanup on abort
      request.signal.addEventListener("abort", () => {
        console.log(`[MCP] SSE connection closed, session: ${sessionId}`);
        clearInterval(keepAlive);
        sessions.delete(sessionId);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}

/**
 * POST /api/mcp - Handle JSON-RPC messages
 */
export async function POST(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32600, message: "Missing sessionId" } },
      { status: 400 }
    );
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32600, message: "Session not found" } },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    console.log(`[MCP] Received message for session ${sessionId}:`, JSON.stringify(body).slice(0, 200));

    const response = await processRequest(body);

    // Send response via SSE if we have one
    if (response) {
      const data = JSON.stringify(response);
      await session.writer.write(session.encoder.encode(`data: ${data}\n\n`));
    }

    // Also return it directly (some clients expect this)
    return NextResponse.json(response || { status: "ok" });
  } catch (error) {
    console.error("[MCP] Error processing message:", error);
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } },
      { status: 400 }
    );
  }
}
