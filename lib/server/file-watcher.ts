/**
 * File Watcher for Research Projects
 * Uses chokidar to watch for file changes and notify clients in real-time
 */

import chokidar from 'chokidar';
import path from 'path';
import type { FSWatcher } from 'chokidar';

const RESEARCH_DIR = process.env.RESEARCH_DIR || process.cwd();

let watcher: FSWatcher | null = null;
let watchers: Set<(event: string, filePath: string) => void> = new Set();

/**
 * Initialize file watcher
 */
export async function initializeWatcher(): Promise<void> {
  if (watcher) {
    console.log('Watcher already initialized');
    return;
  }

  watcher = chokidar.watch(RESEARCH_DIR, {
    ignored: (filePath: string) => {
      // Ignore node_modules, .git, .next
      if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('.next')) {
        return true;
      }

      // Allow .research-progress.json
      if (filePath.endsWith('.research-progress.json')) {
        return false;
      }

      // Ignore other dot files and directories
      if (/(^|[\/\\])\./.test(filePath)) {
        return true;
      }

      return false;
    },
    persistent: true,
    ignoreInitial: true,
    depth: 3,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  });

  watcher.on('all', (event: string, filePath: string) => {
    console.log(`[FileWatcher] ${event}: ${filePath}`);
    notifyWatchers(event, filePath);
  });

  watcher.on('error', (error: unknown) => {
    console.error('[FileWatcher] Error:', error);
  });

  console.log(`[FileWatcher] Initialized for directory: ${RESEARCH_DIR}`);
}

/**
 * Subscribe to file change events
 */
export function onFileChange(callback: (event: string, filePath: string) => void): () => void {
  watchers.add(callback);
  return () => {
    watchers.delete(callback);
  };
}

/**
 * Notify all watchers of a file change
 */
function notifyWatchers(event: string, filePath: string): void {
  watchers.forEach(callback => {
    try {
      callback(event, filePath);
    } catch (err) {
      console.error('Error in watcher callback:', err);
    }
  });
}

/**
 * Close the watcher
 */
export async function closeWatcher(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
    console.log('[FileWatcher] Closed');
  }
}

/**
 * Check if watcher is initialized
 */
export function isWatcherInitialized(): boolean {
  return watcher !== null;
}

/**
 * Get list of active watchers (for debugging)
 */
export function getActiveWatcherCount(): number {
  return watchers.size;
}
