// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// GitHub Pages serves a repo not named <user>.github.io under /<repo>/.
// Change or remove this if the repo is renamed or a custom domain is added.
const base = '/usn0m3_website';

export default defineConfig({
	site: 'https://usn0m3.github.io',
	base: base,
	integrations: [sitemap({ filter: (page) => new URL(page).pathname !== `${base}/404/` })],
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
