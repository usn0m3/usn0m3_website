import { describe, expect, it } from 'vitest';
import { cssText, page } from './helpers';

describe('projects index', () => {
	const html = page('/projects/');

	it('lists every project in order', () => {
		const a = html.indexOf('Task Manager');
		const b = html.indexOf('Edge Cache');
		const c = html.indexOf('Dev CLI Toolkit');
		expect(a).toBeGreaterThan(-1);
		expect(a).toBeLessThan(b);
		expect(b).toBeLessThan(c);
		expect(html).toContain('<title>Projects — Jane Doe</title>');
	});

	it('uses h2 headings for cards under the page h1', () => {
		expect(html).toMatch(/<h2 class="title"[^>]*><a href="\/projects\/task-manager\/"/);
	});
});

describe('project detail', () => {
	it('renders header, links, cover and body', () => {
		const html = page('/projects/task-manager/');
		expect(html).toMatch(/<h1 class="article-title"[^>]*>Task Manager<\/h1>/);
		expect(html).toContain('href="https://github.com/usn0m3/task-manager"');
		expect(html).toMatch(/href="https:\/\/task-manager\.example\.com"[^>]*>\s*Live demo/);
		expect(html).toMatch(/<img[^>]*class="article-cover"|class="article-cover"[^>]*>/);
		expect(html).toContain('<h2 id="problem">Problem</h2>');
		expect(html).toContain('<meta property="og:type" content="article"');
	});

	it('omits the demo button and cover image when the project has none', () => {
		// Match elements, not class names: prose.css may be inlined into the page's <style>.
		const html = page('/projects/edge-cache/');
		expect(html).not.toMatch(/>\s*Live demo\s*</);
		expect(html).not.toMatch(/<img[^>]*article-cover/);
		expect(html).toMatch(/>\s*Source code\s*</);
	});
});

describe('prose styles', () => {
	it('keep long words and code from overflowing narrow screens', () => {
		const css = cssText(page('/projects/task-manager/'));
		expect(css).toMatch(/overflow-wrap:\s*anywhere/);
		expect(css).toMatch(/\.astro-code[^}]*overflow-x:\s*auto/);
	});

	it('keep block spacing on blockquotes (a margin reset must not override `.prose > * + *`)', () => {
		const css = cssText(page('/blog/building-this-site/'));
		expect(css).toMatch(/\.prose blockquote\s*\{/);
		expect(css).not.toMatch(/\.prose blockquote\s*\{[^}]*\bmargin:\s*0\s*[;}]/);
	});
});
