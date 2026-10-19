// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	site: 'https://usn0m3.github.io',
	integrations: [sitemap({ filter: (page) => new URL(page).pathname !== '/404/' })],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Inter',
			cssVariable: '--font-inter',
			weights: ['100 900'],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
	],
	markdown: {
		shikiConfig: { theme: 'github-dark' },
	},
});
