import { describe, expect, it } from 'vitest';
import { exists, htmlFiles, read } from './helpers';

/** Map an internal URL to the file GitHub Pages would serve for it. */
function targetFile(url: string): string {
	const path = decodeURI(url.split(/[?#]/)[0]);
	if (path.endsWith('/')) return `${path.slice(1)}index.html`;
	if (/\.[a-z0-9]+$/i.test(path)) return path.slice(1);
	return `${path.slice(1)}/index.html`;
}

function internalUrls(html: string): string[] {
	const urls: string[] = [];
	for (const [, , value] of html.matchAll(/\b(href|src)="([^"]*)"/g)) urls.push(value);
	for (const [, value] of html.matchAll(/\bsrcset="([^"]*)"/g)) {
		urls.push(...value.split(',').map((candidate) => candidate.trim().split(/\s+/)[0]));
	}
	return urls.filter((url) => url.startsWith('/') && !url.startsWith('//'));
}

describe('whole site', () => {
	const pages = htmlFiles();

	it('builds every expected route', () => {
		for (const file of [
			'index.html',
			'projects/index.html',
			'projects/task-manager/index.html',
			'projects/edge-cache/index.html',
			'projects/cli-toolkit/index.html',
			'blog/index.html',
			'blog/building-this-site/index.html',
			'blog/notes-on-testing/index.html',
			'about/index.html',
			'404.html',
			'rss.xml',
			'sitemap-index.xml',
		]) {
			expect(exists(file), file).toBe(true);
		}
	});

	it('has no broken internal links or assets', () => {
		const broken: string[] = [];
		for (const file of pages) {
			for (const url of internalUrls(read(file))) {
				if (!exists(targetFile(url))) broken.push(`${file} -> ${url}`);
			}
		}
		expect(broken).toEqual([]);
	});

	it('ships no client-side JavaScript', () => {
		for (const file of pages) {
			expect(read(file), file).not.toContain('<script');
		}
	});

	it('never renders empty or undefined attributes', () => {
		for (const file of pages) {
			const html = read(file);
			expect(html, file).not.toMatch(/\b(href|src)=""/);
			expect(html, file).not.toContain('undefined');
		}
	});

	it('lists real pages in the sitemap, without the 404 page', () => {
		const sitemap = read('sitemap-0.xml');
		expect(sitemap).toContain('<loc>https://usn0m3.github.io/blog/building-this-site/</loc>');
		expect(sitemap).toContain('<loc>https://usn0m3.github.io/about/</loc>');
		expect(sitemap).not.toContain('404');
	});
});
