import { ResearchManager } from './research-manager';
import { config } from '@/lib/config';

// Use globalThis to persist instance across hot reloads in development
const globalForResearch = global as unknown as { researchManager: ResearchManager };

export const getResearchManager = () => {
  if (!globalForResearch.researchManager) {
    console.log('[ResearchManager] Initializing new global instance...');
    globalForResearch.researchManager = new ResearchManager(
      config.opencodeUrl,
      config.researchDir
    );
  }
  return globalForResearch.researchManager;
};
