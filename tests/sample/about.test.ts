import { describe, expect, it } from 'vitest';
import { exists, page, read } from '../build/helpers';

describe('about page', () => {
	const html = page('/about/');

	it('renders bio paragraphs', () => {
		expect(html).toContain('<title>About — Pincheng Fan</title>');
		expect(html).toMatch(/<p[^>]*>I(&#39;|')m an electrical engineer based in New York/);
		expect(html).toMatch(/<p[^>]*>Learning new skills has never been more accessible/);
	});

	it('has no résumé sections — those live on LinkedIn', () => {
		for (const heading of ['experience-heading', 'skills-heading', 'education-heading']) {
			expect(html).not.toContain(`id="${heading}"`);
		}
		expect(html).not.toContain('résumé');
	});

	it('offers email and LinkedIn', () => {
		expect(html).toMatch(/<a href="mailto:geneptcf.showplace465@simplelogin.com" class="btn btn-primary"/);
		expect(html).toMatch(/<a href="https:\/\/www\.linkedin\.com\/in\/pincheng-fan-69298a42a" class="btn btn-outline"[^>]*>\s*LinkedIn/);
	});
});

describe('404 page', () => {
	it('exists and links home', () => {
		expect(exists('404.html')).toBe(true);
		const html = read('404.html');
		expect(html).toContain('Off the track.');
		expect(html).toMatch(/<a href="\/" class="btn btn-primary"/);
	});
});
