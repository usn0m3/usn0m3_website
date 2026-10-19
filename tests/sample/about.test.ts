import { describe, expect, it } from 'vitest';
import { exists, page, read } from '../build/helpers';

describe('about page', () => {
	const html = page('/about/');

	it('renders bio paragraphs', () => {
		expect(html).toContain('<title>About — Jane Doe</title>');
		expect(html).toMatch(/<p[^>]*>I(&#39;|')m a software engineer who cares about performance/);
		expect(html).toMatch(/<p[^>]*>Outside work I write/);
	});

	it('renders the experience timeline with formatted periods', () => {
		expect(html).toContain('Acme Corp');
		expect(html).toContain('Jul 2023 — Present');
		expect(html).toContain('Jun 2022 — Sep 2022');
		expect(html).toContain('Cut p95 API latency by 60% with a distributed cache layer.');
	});

	it('renders skills and education', () => {
		expect(html).toContain('Backend and infrastructure');
		expect(html).toContain('TypeScript · Go · Python · SQL');
		expect(html).toContain('Example University');
		expect(html).toContain('Sep 2019 — Jun 2023');
	});

	it('offers the résumé and email', () => {
		expect(html).toMatch(/href="\/resume\.pdf"[^>]*download/);
		expect(html).toContain('href="mailto:hello@example.com"');
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
