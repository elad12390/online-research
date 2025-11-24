import { ResearchManager } from './research-manager';

// Use globalThis to persist instance across hot reloads in development
const globalForResearch = global as unknown as { researchManager: ResearchManager };

export const getResearchManager = () => {
  if (!globalForResearch.researchManager) {
    console.log('[ResearchManager] Initializing new global instance...');
    globalForResearch.researchManager = new ResearchManager(
      process.env.OPENCODE_URL || 'http://localhost:4096',
      process.env.RESEARCH_DIR || './research-projects'
    );
  }
  return globalForResearch.researchManager;
};
