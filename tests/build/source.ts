import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { slug as githubSlug } from 'github-slugger';

/** The `site` URL from astro.config.mjs, without a trailing slash. */
export const SITE = (() => {
	const config = readFileSync(join(process.cwd(), 'astro.config.mjs'), 'utf8');
	const match = config.match(/site:\s*['"]([^'"]+)['"]/);
	if (!match) throw new Error('Could not find `site` in astro.config.mjs');
	return match[1].replace(/\/+$/, '');
})();

export interface SourceEntry {
	file: string;
	slug: string;
	draft: boolean;
}

function markdownFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) return markdownFiles(full);
		return entry.name.endsWith('.md') ? [full] : [];
	});
}

function frontmatter(text: string): string {
	return text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
}

/** Same id rule as Astro's glob loader: frontmatter `slug`, else github-slugger per path segment, minus `/index`. */
function entrySlug(base: string, file: string, fm: string): string {
	const explicit = fm.match(/^slug:\s*['"]?([^'"\r\n]+?)['"]?\s*$/m)?.[1];
	if (explicit) return explicit;
	const segments = relative(base, file).replace(/\.md$/, '').split(sep);
	return segments.map((segment) => githubSlug(segment)).join('/').replace(/\/index$/, '');
}

/** Markdown entries of a collection, read straight from src/content. */
export function sourceEntries(collection: 'blog' | 'projects'): SourceEntry[] {
	const base = join(process.cwd(), 'src', 'content', collection);
	return markdownFiles(base).map((file) => {
		const fm = frontmatter(readFileSync(file, 'utf8'));
		return {
			file: relative(process.cwd(), file).split(sep).join('/'),
			slug: entrySlug(base, file, fm),
			draft: /^draft:\s*true\s*$/m.test(fm),
		};
	});
}
