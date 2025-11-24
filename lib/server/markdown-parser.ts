/**
 * Markdown Parser with YAML frontmatter support
 */

import yaml from 'js-yaml';
import type { ResearchMetadata } from '@/lib/types';

export interface ParsedMarkdown {
  metadata: ResearchMetadata;
  content: string;
}

/**
 * Parse YAML frontmatter from markdown file
 * Expects format:
 * ---
 * title: My Title
 * tags: [tag1, tag2]
 * ---
 * # Content starts here
 */
export function parseMetadata(fileContent: string): ParsedMarkdown {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    return {
      metadata: {},
      content: fileContent
    };
  }

  try {
    const metadata = (yaml.load(match[1]) as ResearchMetadata) || {};
    const markdownContent = match[2];
    return { metadata, content: markdownContent };
  } catch (err) {
    console.error('Error parsing YAML frontmatter:', err);
    return {
      metadata: {},
      content: fileContent
    };
  }
}

/**
 * Extract first heading from markdown content
 */
export function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : null;
}

/**
 * Extract first paragraph from markdown content
 */
export function extractSummary(content: string): string {
  // Remove YAML frontmatter first
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '');
  // Get first non-heading paragraph
  const paragraphs = withoutFrontmatter.split('\n\n').filter(p => {
    const trimmed = p.trim();
    return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('![') && !trimmed.startsWith('[');
  });
  return paragraphs[0]?.substring(0, 150) || '';
}
