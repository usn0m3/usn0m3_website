import { describe, expect, it } from 'vitest';
import { exists, htmlFiles, page, read } from '../build/helpers';

describe('blog index', () => {
	const html = page('/blog/');

	it('lists published posts newest first', () => {
		const a = html.indexOf('Building this site');
		const b = html.indexOf('Notes on testing static sites');
		expect(a).toBeGreaterThan(-1);
		expect(a).toBeLessThan(b);
		expect(html).toContain('<title>Blog — Pincheng Fan</title>');
	});
});

describe('post page', () => {
	const html = page('/blog/building-this-site/');

	it('renders title, date, reading time and tags', () => {
		expect(html).toMatch(/<h1 class="article-title"[^>]*>Building this site<\/h1>/);
		expect(html).toContain('datetime="2026-10-18"');
		expect(html).toContain('Oct 18, 2026');
		expect(html).toMatch(/\d+ min read/);
		expect(html).toContain('#astro');
	});

	it('renders optimized images and highlighted code', () => {
		expect(html).toMatch(/<img[^>]*src="\/_astro\/architecture[^"]*"/);
		expect(html).toContain('class="astro-code');
	});

	it('builds folder-based posts at their folder slug', () => {
		expect(exists('blog/building-this-site/index.html')).toBe(true);
	});
});

describe('rss', () => {
	const xml = read('rss.xml');

	it('is an RSS document with one item per published post', () => {
		expect(xml.startsWith('<?xml')).toBe(true);
		expect(xml).toContain('<rss');
		expect(xml.match(/<item>/g)).toHaveLength(2);
		expect(xml).toContain('<link>https://usn0m3.github.io/blog/building-this-site/</link>');
	});
});

describe('draft never leaks', () => {
	it('is absent from every page, the feed and the sitemap', () => {
		expect(exists('blog/draft-ideas/index.html')).toBe(false);
		const files = [...htmlFiles(), 'rss.xml', 'sitemap-0.xml'];
		for (const file of files) {
			const text = read(file);
			expect(text, file).not.toContain('Unpublished draft ideas');
			expect(text, file).not.toContain('draft-ideas');
		}
	});
});
