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
	links: { github: 'https://github.com/usn0m3' },
	skills: [{ group: 'Languages', items: ['TypeScript'] }],
	experience: [{ company: 'Acme', role: 'Engineer', start: '2023-07', end: 'present', summary: 'Work.' }],
	education: [{ school: 'Uni', degree: 'B.S.', start: '2019-09', end: '2023-06' }],
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
	it('accepts a valid profile and defaults highlights to []', () => {
		const profile = profileSchema.parse(validProfile);
		expect(profile.experience[0].highlights).toEqual([]);
	});

	it('rejects an invalid email', () => {
		expect(profileSchema.safeParse({ ...validProfile, email: 'not-an-email' }).success).toBe(false);
	});

	it('requires a GitHub link', () => {
		expect(profileSchema.safeParse({ ...validProfile, links: {} }).success).toBe(false);
	});

	it('rejects year-months that are not YYYY-MM, with a helpful message', () => {
		const result = profileSchema.safeParse({
			...validProfile,
			experience: [{ ...validProfile.experience[0], start: '2023-7' }],
		});
		expect(result.success).toBe(false);
		expect(JSON.stringify(result.error?.issues)).toContain('YYYY-MM');
	});

	it('allows "present" only as an end date', () => {
		const badStart = { ...validProfile.experience[0], start: 'present' };
		expect(profileSchema.safeParse({ ...validProfile, experience: [badStart] }).success).toBe(false);
	});
});
