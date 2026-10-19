// Content-agnostic checks: these run in CI and must hold for any content the
// site owner adds, including none at all.
import { describe, expect, it } from 'vitest';
import { exists, htmlFiles, read } from './helpers';
import { BASE, SITE, sourceEntries } from './source';

/** Public URL of the site root, e.g. https://usn0m3.github.io/usn0m3_website */
const ROOT = `${SITE}${BASE}`;

/**
 * Map an internal URL to the dist/ file GitHub Pages would serve for it.
 * Returns null for root-relative URLs that skip the base path: on a project
 * site those point outside the site and always 404.
 */
function targetFile(url: string): string | null {
	const full = decodeURI(url.split(/[?#]/)[0]);
	if (BASE && full !== BASE && !full.startsWith(`${BASE}/`)) return null;
	const path = full.slice(BASE.length) || '/';
	if (path.endsWith('/')) return `${path.slice(1)}index.html`;
	if (/\.[a-z0-9]+$/i.test(path)) return path.slice(1);
	return `${path.slice(1)}/index.html`;
}

function resolves(url: string): boolean {
	const file = targetFile(url);
	return file !== null && exists(file);
}

function internalUrls(html: string): string[] {
	const urls: string[] = [];
	for (const [, , value] of html.matchAll(/\b(href|src)="([^"]*)"/g)) urls.push(value);
	for (const [, value] of html.matchAll(/\bsrcset="([^"]*)"/g)) {
		urls.push(...value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]));
	}
	return urls.filter((url) => url.startsWith('/') && !url.startsWith('//'));
}

const pages = htmlFiles();
const rss = read('rss.xml');
const sitemap = read('sitemap-0.xml');
const posts = sourceEntries('blog');
const projects = sourceEntries('projects');

describe('routes', () => {
	it('builds the fixed pages, feed and sitemap', () => {
		for (const file of [
			'index.html',
			'projects/index.html',
			'blog/index.html',
			'about/index.html',
			'404.html',
			'rss.xml',
			'sitemap-index.xml',
		]) {
			expect(exists(file), file).toBe(true);
		}
	});

	it('builds a page for every project', () => {
		for (const project of projects) {
			expect(exists(`projects/${project.slug}/index.html`), project.file).toBe(true);
		}
	});

	it('publishes every non-draft post as a page, a feed item and a sitemap entry', () => {
		for (const post of posts.filter((p) => !p.draft)) {
			const url = `${ROOT}/blog/${post.slug}/`;
			expect(exists(`blog/${post.slug}/index.html`), post.file).toBe(true);
			expect(rss, post.file).toContain(`<link>${url}</link>`);
			expect(sitemap, post.file).toContain(`<loc>${url}</loc>`);
		}
	});

	it('never publishes drafts', () => {
		for (const post of posts.filter((p) => p.draft)) {
			expect(exists(`blog/${post.slug}/index.html`), post.file).toBe(false);
			expect(rss, post.file).not.toContain(`/blog/${post.slug}/`);
			expect(sitemap, post.file).not.toContain(`/blog/${post.slug}/`);
			for (const file of pages) {
				expect(read(file), `${post.file} in ${file}`).not.toContain(`/blog/${post.slug}/"`);
			}
		}
	});

	it('keeps the 404 page out of the sitemap', () => {
		expect(sitemap).not.toContain(`<loc>${ROOT}/404/</loc>`);
	});
});

describe('empty states', () => {
	const home = read('index.html');
	const published = posts.filter((p) => !p.draft);

	it('only promotes the projects page from the hero when there are projects', () => {
		const heroCta = `<a href="${BASE}/projects/" class="btn btn-primary"`;
		if (projects.length > 0) expect(home).toContain(heroCta);
		else expect(home).not.toContain(heroCta);
	});

	it('hides home sections that would be empty', () => {
		if (projects.length === 0) expect(home).not.toContain('id="featured-heading"');
		if (published.length === 0) expect(home).not.toContain('id="latest-heading"');
	});

	it('explains empty list pages instead of rendering nothing', () => {
		if (projects.length === 0) expect(read('projects/index.html')).toContain('class="empty"');
		if (published.length === 0) expect(read('blog/index.html')).toContain('class="empty"');
	});
});

describe('links', () => {
	it('has no broken internal links or assets (all under the base path)', () => {
		const broken: string[] = [];
		for (const file of pages) {
			for (const url of internalUrls(read(file))) {
				if (!resolves(url)) broken.push(`${file} -> ${url}`);
			}
		}
		expect(broken).toEqual([]);
	});

	it('points the feed itself at the site home, not the bare domain', () => {
		const channelLink = rss.match(/<channel>[\s\S]*?<link>([^<]+)<\/link>/)?.[1];
		expect(channelLink).toBe(`${ROOT}/`);
	});

	it('points every feed item at a page that exists', () => {
		const links = [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((m) => m[1]);
		for (const link of links) {
			expect(link.startsWith(`${ROOT}/`), link).toBe(true);
			expect(resolves(link.slice(SITE.length)), link).toBe(true);
		}
	});
});

describe('every page', () => {
	it('ships no client-side JavaScript', () => {
		for (const file of pages) {
			expect(read(file), file).not.toContain('<script');
		}
	});

	it('never renders empty or undefined link attributes', () => {
		for (const file of pages) {
			const html = read(file);
			expect(html, file).not.toMatch(/\b(href|src)=""/);
			expect(html, file).not.toMatch(/="undefined"/);
		}
	});

	it('has language, title, description and canonical URL', () => {
		const canonical = `<link rel="canonical" href="${ROOT}/`;
		for (const file of pages) {
			const html = read(file);
			expect(html, file).toContain('<html lang="en"');
			expect(html, file).toMatch(/<title>[^<]+<\/title>/);
			expect(html, file).toMatch(/<meta name="description" content="[^"]+"/);
			expect(html, file).toContain(canonical);
		}
	});
});
