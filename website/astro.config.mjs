// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://elad12390.github.io',
	base: '/online-research',
	integrations: [
		starlight({
			title: 'Research Portal',
			description: 'AI-powered research assistant with web search, multi-provider LLM support, and a beautiful web interface.',
			logo: {
				src: './src/assets/logo.png',
				alt: 'Research Portal',
			},
			favicon: '/favicon-32.png',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/elad12390/online-research' },
			],
			editLink: {
				baseUrl: 'https://github.com/elad12390/online-research/edit/main/website/',
			},
			customCss: [
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'getting-started/introduction' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'Installation', slug: 'getting-started/installation' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Configuration', slug: 'guides/configuration' },
						{ label: 'Docker Deployment', slug: 'guides/docker' },
						{ label: 'MCP Integration', slug: 'guides/mcp-integration' },
						{ label: 'Research Agents', slug: 'guides/research-agents' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Architecture', slug: 'reference/architecture' },
						{ label: 'API Reference', slug: 'reference/api' },
						{ label: 'MCP Server', slug: 'reference/mcp-server' },
						{ label: 'Environment Variables', slug: 'reference/environment' },
					],
				},
				{
					label: 'Features',
					slug: 'features',
				},
			],
			head: [
				{
					tag: 'meta',
					attrs: {
						property: 'og:image',
						content: 'https://elad12390.github.io/online-research/assets/screenshot-main.png',
					},
				},
				{
					tag: 'link',
					attrs: {
						rel: 'apple-touch-icon',
						href: '/online-research/apple-touch-icon.png',
					},
				},
			],
		}),
	],
});
