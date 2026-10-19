import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { postSchema, profileSchema, projectSchema } from '../../src/schemas';

// Stand-in for Astro's image() helper, which only exists inside content.config.ts.
const project = projectSchema(() => z.string());

const validProfile = {
	name: 'Jane Doe',
	role: 'Software Engineer',
	location: 'Shanghai',
	headline: 'Built for speed.',
	intro: 'I build things.',
	bio: 'Hello.',
	email: 'hello@example.com',
	links: { github: 'https://github.com/usn0m3', linkedin: 'https://www.linkedin.com/in/someone' },
};

describe('postSchema', () => {
	it('accepts a minimal post and applies defaults', () => {
		const post = postSchema.parse({ title: 'T', description: 'D', pubDate: '2026-10-18' });
		expect(post.tags).toEqual([]);
		expect(post.draft).toBe(false);
		expect(post.pubDate).toBeInstanceOf(Date);
	});

	it('rejects a missing or empty title', () => {
		expect(postSchema.safeParse({ description: 'D', pubDate: '2026-10-18' }).success).toBe(false);
		expect(postSchema.safeParse({ title: '', description: 'D', pubDate: '2026-10-18' }).success).toBe(false);
	});

	it('rejects a date that cannot be parsed', () => {
		expect(postSchema.safeParse({ title: 'T', description: 'D', pubDate: 'yesterday' }).success).toBe(false);
	});

	it('rejects a blank date instead of turning it into 1970', () => {
		// `pubDate:` with nothing after it is YAML null.
		expect(postSchema.safeParse({ title: 'T', description: 'D', pubDate: null }).success).toBe(false);
		expect(
			postSchema.safeParse({ title: 'T', description: 'D', pubDate: '2026-10-18', updatedDate: null }).success,
		).toBe(false);
	});

	it('rejects a bare number such as a year', () => {
		expect(postSchema.safeParse({ title: 'T', description: 'D', pubDate: 2026 }).success).toBe(false);
	});

	it('accepts YAML dates (Date objects) and ISO date-time strings', () => {
		const fromYaml = postSchema.parse({ title: 'T', description: 'D', pubDate: new Date('2026-10-18') });
		expect(fromYaml.pubDate.toISOString()).toBe('2026-10-18T00:00:00.000Z');
		const withTime = postSchema.parse({ title: 'T', description: 'D', pubDate: '2026-10-18T09:30:00+08:00' });
		expect(withTime.pubDate.toISOString()).toBe('2026-10-18T01:30:00.000Z');
	});
});

describe('projectSchema', () => {
	it('accepts a minimal project and applies defaults', () => {
		const p = project.parse({ title: 'P', summary: 'S', stack: ['Go'] });
		expect(p.featured).toBe(false);
		expect(p.order).toBe(100);
	});

	it('rejects an empty stack', () => {
		expect(project.safeParse({ title: 'P', summary: 'S', stack: [] }).success).toBe(false);
	});

	it('rejects links that are not full URLs', () => {
		expect(project.safeParse({ title: 'P', summary: 'S', stack: ['Go'], repo: 'github.com/x/y' }).success).toBe(false);
	});

	it('passes the cover through the image helper', () => {
		expect(project.parse({ title: 'P', summary: 'S', stack: ['Go'], cover: './cover.png' }).cover).toBe('./cover.png');
	});
});

describe('profileSchema', () => {
	it('accepts a profile with just identity, bio and links — no résumé sections', () => {
		expect(profileSchema.parse(validProfile).name).toBe('Jane Doe');
	});

	it('makes LinkedIn optional', () => {
		const { linkedin: _, ...githubOnly } = validProfile.links;
		expect(profileSchema.safeParse({ ...validProfile, links: githubOnly }).success).toBe(true);
	});

	it('rejects an invalid email', () => {
		expect(profileSchema.safeParse({ ...validProfile, email: 'not-an-email' }).success).toBe(false);
	});

	it('requires a GitHub link', () => {
		expect(profileSchema.safeParse({ ...validProfile, links: {} }).success).toBe(false);
	});

	it('rejects a LinkedIn value that is not a full URL', () => {
		const links = { ...validProfile.links, linkedin: 'linkedin.com/in/someone' };
		expect(profileSchema.safeParse({ ...validProfile, links }).success).toBe(false);
	});
});
