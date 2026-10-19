import { describe, expect, it } from 'vitest';
import { withBase } from '../../src/lib/url';

describe('withBase', () => {
	it('prefixes site paths with the base path', () => {
		expect(withBase('/usn0m3_website', '/about/')).toBe('/usn0m3_website/about/');
		expect(withBase('/usn0m3_website', '/rss.xml')).toBe('/usn0m3_website/rss.xml');
	});

	it('maps the home page to the base itself, with a trailing slash', () => {
		expect(withBase('/usn0m3_website', '/')).toBe('/usn0m3_website/');
	});

	it('tolerates a trailing slash on the base', () => {
		expect(withBase('/usn0m3_website/', '/blog/')).toBe('/usn0m3_website/blog/');
	});

	it('leaves paths alone when the site lives at the root', () => {
		expect(withBase('/', '/about/')).toBe('/about/');
		expect(withBase('', '/')).toBe('/');
	});
});
