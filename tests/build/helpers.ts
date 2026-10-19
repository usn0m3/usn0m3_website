import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const DIST = join(process.cwd(), 'dist');

if (!existsSync(DIST)) {
	throw new Error('dist/ not found. Run `npm run build` before `npm run test:build`.');
}

export function exists(file: string): boolean {
	return existsSync(join(DIST, file));
}

export function read(file: string): string {
	return readFileSync(join(DIST, file), 'utf8');
}

/** '/blog/' -> dist/blog/index.html, '/' -> dist/index.html */
export function page(route: string): string {
	const trimmed = route.replace(/^\/+|\/+$/g, '');
	return read(trimmed ? `${trimmed}/index.html` : 'index.html');
}

/** All .html files under dist/, as forward-slash paths relative to dist/. */
export function htmlFiles(dir: string = DIST): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) return htmlFiles(full);
		return entry.name.endsWith('.html') ? [relative(DIST, full).split(sep).join('/')] : [];
	});
}

/** The slice of `html` from the first `start` marker up to the next `end` marker. */
export function between(html: string, start: string, end: string): string {
	const i = html.indexOf(start);
	if (i === -1) throw new Error(`Marker not found: ${start}`);
	const j = html.indexOf(end, i + start.length);
	return html.slice(i, j === -1 ? undefined : j);
}

/** Inline <style> blocks of a page plus every bundled stylesheet in dist/_astro. */
export function cssText(html: string): string {
	const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
	const astroDir = join(DIST, '_astro');
	const files = existsSync(astroDir)
		? readdirSync(astroDir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(astroDir, f), 'utf8'))
		: [];
	return [inline, ...files].join('\n');
}
