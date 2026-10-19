import { describe, expect, it } from 'vitest';
import { page } from './helpers';

describe('base layout', () => {
	const html = page('/');

	it('declares language and title', () => {
		expect(html).toContain('<html lang="en"');
		expect(html).toContain('<title>Jane Doe — Software Engineer</title>');
	});

	it('has SEO and social meta', () => {
		expect(html).toMatch(/<meta name="description" content="I build fast, reliable web apps/);
		expect(html).toMatch(/<link rel="canonical" href="https:\/\/usn0m3\.github\.io\/"/);
		expect(html).toMatch(/<meta property="og:title" content="Jane Doe — Software Engineer"/);
		expect(html).toMatch(/<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/rss\.xml"/);
	});

	it('preloads the Inter font', () => {
		expect(html).toMatch(/<link rel="preload"[^>]*as="font"/);
	});

	it('renders navigation with all sections', () => {
		for (const href of ['/projects/', '/blog/', '/about/']) {
			expect(html).toContain(`href="${href}"`);
		}
		expect(html).toContain('<nav aria-label="Main"');
	});

	it('renders the footer links and a skip link', () => {
		expect(html).toContain('href="https://github.com/usn0m3"');
		expect(html).toContain('href="mailto:hello@example.com"');
		expect(html).toContain('href="#main"');
	});
});
