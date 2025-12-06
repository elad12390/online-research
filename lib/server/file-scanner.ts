/**
 * Research Project File Scanner
 * Scans the research directory and returns all projects with metadata
 * 
 * Refactored to use centralized config module
 */

import { readdir, readFile, stat, rm } from 'fs/promises';
import path from 'path';
import { parseMetadata } from './markdown-parser';
import type { ResearchProject, ResearchMetadata, ResearchProgress } from '@/lib/types';
import { ResearchDatabase } from '@/lib/research-wizard/research-wizard-db';
import { config } from '@/lib/config';

/**
 * Get research directory from centralized config
 * RESEARCH_DIR can be an absolute path like /Users/username/research
 */
function getResearchDir(): string {
  const researchDir = config.researchDir;
  
  if (researchDir === './research-projects') {
    // Using default - try to use a sibling directory named 'research'
    const projectRoot = process.cwd();
    const parentDir = path.dirname(projectRoot);
    const defaultResearchDir = path.join(parentDir, 'research');
    console.log(`[FileScanner] RESEARCH_DIR not set, using default: ${defaultResearchDir}`);
    return defaultResearchDir;
  }
  
  // Support both absolute and relative paths
  const resolvedPath = path.isAbsolute(researchDir) 
    ? researchDir 
    : path.resolve(process.cwd(), researchDir);
  
  console.log(`[FileScanner] Using RESEARCH_DIR: ${resolvedPath}`);
  return resolvedPath;
}

const RESEARCH_DIR = getResearchDir();
const SKIP_DIRS = new Set(['node_modules', '.git', 'public', '.next', 'dist', 'build', '.venv']);

/**
 * Scan the research directory and return all projects
 */
export async function scanResearchProjects(): Promise<Record<string, ResearchProject>> {
  const projects: Record<string, ResearchProject> = {};
  
  // Get research ID mapping from database
  let researchIdMap: Record<string, string> = {};
  try {
    // We need to locate the DB file. Typically in RESEARCH_DIR/research-wizard.db
    // but ResearchDatabase defaults to ./research-wizard.db
    // Let's try to find the correct path
    
    // Try 1: In RESEARCH_DIR
    const dbPathInResearchDir = path.join(RESEARCH_DIR, 'research-wizard.db');
    
    // Try 2: Centralized config or default
    const dbPath = config.dbPath || dbPathInResearchDir;
    
    const db = new ResearchDatabase(dbPath);
    const researches = db.getAllResearches();
    db.close();
    
    for (const r of researches) {
      if (r.projectDir && r.id) {
        researchIdMap[r.projectDir] = r.id;
      }
    }
  } catch (err) {
    console.warn('Could not load research database map:', err);
    // Continue without DB mapping
  }

  try {
    const items = await readdir(RESEARCH_DIR);

    for (const item of items) {
      const itemPath = path.join(RESEARCH_DIR, item);

      try {
        const itemStat = await stat(itemPath);

        // Skip non-directories and ignored directories
        if (!itemStat.isDirectory() || SKIP_DIRS.has(item)) {
          continue;
        }

        // Check if README.md exists
        const readmePath = path.join(itemPath, 'README.md');
        try {
          await stat(readmePath);
        } catch {
          // No README.md, skip this directory
          continue;
        }

        // Get all markdown and HTML files
        const files = await readdir(itemPath);
        const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.html')).sort((a, b) => {
          if (a === 'README.md') return -1;
          if (b === 'README.md') return 1;
          return a.localeCompare(b);
        });

        // Load metadata from metadata.json (preferred) or README (fallback)
        let metadata: ResearchMetadata = {};
        let projectTitle = item; // Default to folder name
        
        // Try metadata.json first
        const metadataPath = path.join(itemPath, 'metadata.json');
        try {
          const metadataContent = await readFile(metadataPath, 'utf-8');
          const metadataJson = JSON.parse(metadataContent);
          metadata = metadataJson;
          
          if (metadataJson.title) {
            projectTitle = metadataJson.title;
          }
        } catch (err) {
          // No metadata.json or parse error, try README fallback
          try {
            const readmeContent = await readFile(readmePath, 'utf-8');
            const parsed = parseMetadata(readmeContent);
            metadata = parsed.metadata;
            
            // Extract title from metadata or first heading
            if (metadata.title) {
              projectTitle = metadata.title;
            } else {
              // Try to extract from markdown heading
              const { extractTitle } = await import('./markdown-parser');
              const extractedTitle = extractTitle(parsed.content);
              if (extractedTitle) {
                projectTitle = extractedTitle;
              }
            }
          } catch (readmeErr) {
            console.error(`Error loading metadata for ${item}:`, readmeErr);
          }
        }

        // Load progress file if it exists
        let progress: ResearchProgress | null = null;
        try {
          const progressPath = path.join(itemPath, '.research-progress.json');
          const progressContent = await readFile(progressPath, 'utf-8');
          progress = JSON.parse(progressContent);
        } catch (err) {
          // No progress file, that's okay
        }

        // Lookup research ID from DB map
        const researchId = researchIdMap[itemPath];

        projects[item] = {
          id: item,
          researchId: researchId, // Add the DB UUID
          name: projectTitle,
          path: itemPath,
          files: mdFiles,
          metadata,
          progress,
          createdAt: itemStat.birthtime,
          modifiedAt: itemStat.mtime
        };
      } catch (err) {
        console.error(`Error processing item ${item}:`, err);
      }
    }
  } catch (err) {
    console.error('Error scanning research projects:', err);
  }

  return projects;
}

/**
 * Get a specific project by ID
 */
export async function getProject(projectId: string): Promise<ResearchProject | null> {
  const projects = await scanResearchProjects();
  return projects[projectId] || null;
}

/**
 * Check if a project exists
 */
export async function projectExists(projectId: string): Promise<boolean> {
  const project = await getProject(projectId);
  return !!project;
}

/**
 * Get the absolute path for a project file
 */
export function getProjectFilePath(projectId: string, fileName: string): string {
  // Security: prevent directory traversal
  if (fileName.includes('..') || fileName.includes('/')) {
    throw new Error('Invalid filename');
  }

  const projectPath = path.join(RESEARCH_DIR, projectId);
  const filePath = path.join(projectPath, fileName);

  // Ensure the file is within the project directory
  const normalized = path.normalize(filePath);
  const projectNormalized = path.normalize(projectPath);

  if (!normalized.startsWith(projectNormalized)) {
    throw new Error('File path outside project directory');
  }

  return filePath;
}

/**
 * Delete a project and all its files
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    // Security: prevent directory traversal
    if (projectId.includes('..') || projectId.includes('/')) {
      console.error('Invalid project ID:', projectId);
      return false;
    }

    // Check if project exists first
    const project = await getProject(projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return false;
    }

    const projectPath = path.join(RESEARCH_DIR, projectId);

    // Ensure we're deleting within RESEARCH_DIR
    const normalized = path.normalize(projectPath);
    const researchNormalized = path.normalize(RESEARCH_DIR);

    if (!normalized.startsWith(researchNormalized)) {
      console.error('Project path outside research directory');
      return false;
    }

    // Delete the directory recursively
    await rm(projectPath, { recursive: true, force: true });
    console.log(`Successfully deleted project: ${projectId}`);
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}
