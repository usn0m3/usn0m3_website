import { describe, expect, it } from 'vitest';
import { exists, page, read } from '../build/helpers';

describe('about page', () => {
	const html = page('/about/');

	it('renders bio paragraphs', () => {
		expect(html).toContain('<title>About — Jane Doe</title>');
		expect(html).toMatch(/<p[^>]*>I(&#39;|')m a software engineer who cares about performance/);
		expect(html).toMatch(/<p[^>]*>Outside work I write/);
	});

	it('has no résumé sections — those live on LinkedIn', () => {
		for (const heading of ['experience-heading', 'skills-heading', 'education-heading']) {
			expect(html).not.toContain(`id="${heading}"`);
		}
		expect(html).not.toContain('résumé');
	});

	it('offers email and LinkedIn', () => {
		expect(html).toMatch(/<a href="mailto:hello@example\.com" class="btn btn-primary"/);
		expect(html).toMatch(/<a href="https:\/\/www\.linkedin\.com\/in\/your-profile" class="btn btn-outline"[^>]*>\s*LinkedIn/);
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
