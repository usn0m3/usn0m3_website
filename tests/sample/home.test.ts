import { describe, expect, it } from 'vitest';
import { between, exists, page } from '../build/helpers';

describe('home page', () => {
	const html = page('/');

	it('renders the hero from profile.yaml', () => {
		expect(html).toContain('Making the inevitable happen a little faster.');
		expect(html).toContain('Electrical Engineer · New York');
		expect(html).toMatch(/<a href="\/projects\/" class="btn btn-primary"[^>]*>\s*View projects/);
		expect(html).toMatch(/<a href="https:\/\/www\.linkedin\.com\/in\/pincheng-fan-69298a42a" class="btn btn-outline"[^>]*>\s*LinkedIn/);
		expect(html).not.toContain('résumé');
		expect(html).toMatch(/href="mailto:geneptcf.showplace465@simplelogin.com"[^>]*>\s*Get in touch →/);
	});

	it('shows featured projects only, in order', () => {
		const featured = between(html, 'id="featured-heading"', '</section>');
		expect(featured).toContain('Task Manager');
		expect(featured).toContain('Edge Cache');
		expect(featured).not.toContain('Dev CLI Toolkit');
		expect(featured.indexOf('Task Manager')).toBeLessThan(featured.indexOf('Edge Cache'));
	});

	it('renders a cover image when present and a placeholder when not', () => {
		const withCover = between(html, 'href="/projects/task-manager/"', '</article>');
		expect(withCover).toMatch(/<img[^>]*src="\/_astro\//);
		const withoutCover = between(html, 'href="/projects/edge-cache/"', '</article>');
		expect(withoutCover).toContain('class="placeholder"');
		expect(withoutCover).not.toContain('<img');
	});

	it('lists the latest published posts, newest first, without drafts', () => {
		const latest = between(html, 'id="latest-heading"', '</section>');
		expect(latest.indexOf('Building this site')).toBeGreaterThan(-1);
		expect(latest.indexOf('Building this site')).toBeLessThan(latest.indexOf('Notes on testing static sites'));
		expect(latest).toContain('datetime="2026-10-18"');
		expect(html).not.toContain('Unpublished draft ideas');
	});

	it('no longer ships a résumé PDF', () => {
		expect(exists('resume.pdf')).toBe(false);
	});
});
