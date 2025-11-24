/**
 * Global State Management with Zustand
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ResearchProject, ResearchProgress } from './types';

// Helper to check if projects have changed
function projectsEqual(a: Record<string, ResearchProject>, b: Record<string, ResearchProject>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!b[key]) return false;
    
    const projectA = a[key];
    const projectB = b[key];
    
    // Compare essential properties
    if (
      projectA.id !== projectB.id ||
      projectA.name !== projectB.name ||
      projectA.modifiedAt?.toString() !== projectB.modifiedAt?.toString() ||
      projectA.files.length !== projectB.files.length ||
      projectA.files.join(',') !== projectB.files.join(',')
    ) {
      return false;
    }
  }
  
  return true;
}

export interface StoreState {
  // Data
  projects: Record<string, ResearchProject>;
  currentProjectId: string | null;
  currentFileName: string | null;
  expandedProjects: Set<string>;
  projectOrder: string[]; // Array of project IDs in custom order

  // UI
  wsConnected: boolean;
  sidebarOpen: boolean;

  // Favorites & Recent
  favorites: string[]; // "projectId:fileName"
  recent: Array<{ projectId: string; fileName: string; timestamp: number }>;

  // Command palette
  commandPaletteOpen: boolean;

  // Actions
  setProjects: (projects: Record<string, ResearchProject>) => void;
  setCurrentProject: (projectId: string | null) => void;
  setCurrentFile: (fileName: string | null) => void;
  toggleProjectExpanded: (projectId: string) => void;
  setExpandedProjects: (projectIds: Set<string>) => void;
  setProjectOrder: (order: string[]) => void;
  setWsConnected: (connected: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Favorites
  toggleFavorite: (projectId: string, fileName: string) => void;
  isFavorite: (projectId: string, fileName: string) => boolean;
  addToFavorites: (projectId: string, fileName: string) => void;
  removeFromFavorites: (projectId: string, fileName: string) => void;

  // Recent
  addToRecent: (projectId: string, fileName: string) => void;
  clearRecent: () => void;
  getRecent: () => Array<{ projectId: string; fileName: string; timestamp: number }>;
}

const FAVORITES_KEY = 'portal-favorites';
const RECENT_KEY = 'portal-recent';
const EXPANDED_KEY = 'portal-expanded';
const PROJECT_ORDER_KEY = 'portal-project-order';

// Load from localStorage
function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadRecent(): Array<{ projectId: string; fileName: string; timestamp: number }> {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function loadExpanded(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const items = JSON.parse(localStorage.getItem(EXPANDED_KEY) || '[]');
    return new Set(items);
  } catch {
    return new Set();
  }
}

function loadProjectOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(PROJECT_ORDER_KEY) || '[]');
  } catch {
    return [];
  }
}

// Save to localStorage
function saveFavorites(favorites: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    console.error('Failed to save favorites to localStorage');
  }
}

function saveRecent(recent: Array<{ projectId: string; fileName: string; timestamp: number }>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    console.error('Failed to save recent to localStorage');
  }
}

function saveExpanded(expanded: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(Array.from(expanded)));
  } catch {
    console.error('Failed to save expanded to localStorage');
  }
}

function saveProjectOrder(order: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROJECT_ORDER_KEY, JSON.stringify(order));
  } catch {
    console.error('Failed to save project order to localStorage');
  }
}

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
    projects: {},
    currentProjectId: null,
    currentFileName: null,
    expandedProjects: loadExpanded(),
    projectOrder: loadProjectOrder(),
    wsConnected: false,
    sidebarOpen: true,
    favorites: loadFavorites(),
    recent: loadRecent(),
    commandPaletteOpen: false,

    setProjects: (projects) => {
      const currentProjects = get().projects;
      // Only update if projects have actually changed
      if (!projectsEqual(currentProjects, projects)) {
        set({ projects });
        
        // Add new projects to the top of the order
        const currentOrder = get().projectOrder;
        const newProjectIds = Object.keys(projects);
        const existingOrderSet = new Set(currentOrder);
        
        // Find new projects that aren't in the order yet
        const newProjects = newProjectIds.filter(id => !existingOrderSet.has(id));
        
        // Add new projects to the top
        if (newProjects.length > 0) {
          const updatedOrder = [...newProjects, ...currentOrder];
          set({ projectOrder: updatedOrder });
          saveProjectOrder(updatedOrder);
        }
      }
    },

    setCurrentProject: (projectId) =>
      set({ currentProjectId: projectId }),

    setCurrentFile: (fileName) =>
      set({ currentFileName: fileName }),

    toggleProjectExpanded: (projectId) =>
      set((state) => {
        const expanded = new Set(state.expandedProjects);
        if (expanded.has(projectId)) {
          expanded.delete(projectId);
        } else {
          expanded.add(projectId);
        }
        saveExpanded(expanded);
        return { expandedProjects: expanded };
      }),

    setExpandedProjects: (expanded) => {
      saveExpanded(expanded);
      set({ expandedProjects: expanded });
    },

    setProjectOrder: (order) => {
      saveProjectOrder(order);
      set({ projectOrder: order });
    },

    setWsConnected: (connected) =>
      set({ wsConnected: connected }),

    setSidebarOpen: (open) =>
      set({ sidebarOpen: open }),

    toggleSidebar: () =>
      set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    toggleCommandPalette: () =>
      set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

    setCommandPaletteOpen: (open) =>
      set({ commandPaletteOpen: open }),

    toggleFavorite: (projectId, fileName) => {
      set((state) => {
        const key = `${projectId}:${fileName}`;
        const favorites = state.favorites.includes(key)
          ? state.favorites.filter((f) => f !== key)
          : [...state.favorites, key];
        saveFavorites(favorites);
        return { favorites };
      });
    },

    isFavorite: (projectId, fileName) => {
      const state = get();
      const key = `${projectId}:${fileName}`;
      return state.favorites.includes(key);
    },

    addToFavorites: (projectId, fileName) => {
      set((state) => {
        const key = `${projectId}:${fileName}`;
        if (!state.favorites.includes(key)) {
          const favorites = [...state.favorites, key];
          saveFavorites(favorites);
          return { favorites };
        }
        return state;
      });
    },

    removeFromFavorites: (projectId, fileName) => {
      set((state) => {
        const key = `${projectId}:${fileName}`;
        const favorites = state.favorites.filter((f) => f !== key);
        saveFavorites(favorites);
        return { favorites };
      });
    },

    addToRecent: (projectId, fileName) => {
      set((state) => {
        // Remove if already in recent
        let recent = state.recent.filter(
          (r) => !(r.projectId === projectId && r.fileName === fileName)
        );

        // Add to beginning
        recent = [
          { projectId, fileName, timestamp: Date.now() },
          ...recent
        ];

        // Keep only last 10
        recent = recent.slice(0, 10);

        saveRecent(recent);
        return { recent };
      });
    },

    clearRecent: () => {
      saveRecent([]);
      set({ recent: [] });
    },

    getRecent: () => {
      return get().recent;
    }
  }))
);

// Convenience hook for watching specific selectors
export const useProjects = () => useStore((state) => state.projects);
export const useCurrentProject = () => useStore((state) => state.currentProjectId);
export const useCurrentFile = () => useStore((state) => state.currentFileName);
export const useWsConnected = () => useStore((state) => state.wsConnected);
export const useSidebarOpen = () => useStore((state) => state.sidebarOpen);
export const useCommandPaletteOpen = () => useStore((state) => state.commandPaletteOpen);
export const useFavorites = () => useStore((state) => state.favorites);
export const useRecent = () => useStore((state) => state.recent);
export const useProjectOrder = () => useStore((state) => state.projectOrder);
