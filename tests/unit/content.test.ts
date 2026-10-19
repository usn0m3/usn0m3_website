import { describe, expect, it } from 'vitest';
import {
	formatDate,
	formatYearMonth,
	isoDate,
	paragraphs,
	readingTime,
	selectFeatured,
	selectPosts,
	sortProjects,
} from '../../src/lib/content';

const post = (id: string, pubDate: string, draft = false) => ({ id, data: { pubDate: new Date(pubDate), draft } });
const project = (id: string, order: number, featured = false, title = id) => ({
	id,
	data: { title, order, featured },
});

describe('selectPosts', () => {
	const posts = [post('old', '2025-01-01'), post('draft', '2026-12-01', true), post('new', '2026-06-01')];

	it('drops drafts and sorts newest first', () => {
		expect(selectPosts(posts, { includeDrafts: false }).map((p) => p.id)).toEqual(['new', 'old']);
	});

	it('keeps drafts when asked', () => {
		expect(selectPosts(posts, { includeDrafts: true }).map((p) => p.id)).toEqual(['draft', 'new', 'old']);
	});

	it('does not mutate its input', () => {
		const before = posts.map((p) => p.id);
		selectPosts(posts, { includeDrafts: false });
		expect(posts.map((p) => p.id)).toEqual(before);
	});
});

describe('sortProjects', () => {
	it('sorts by order, then by title', () => {
		const list = [project('c', 2), project('b', 1, false, 'Beta'), project('a', 1, false, 'Alpha'), project('d', 100)];
		expect(sortProjects(list).map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
	});
});

describe('selectFeatured', () => {
	it('keeps featured projects only, sorted, capped at the limit', () => {
		const list = [project('x', 5, true), project('y', 1, true), project('z', 0, false), project('w', 3, true), project('v', 4, true)];
		expect(selectFeatured(list, 3).map((p) => p.id)).toEqual(['y', 'w', 'v']);
	});

	it('defaults to a limit of 3', () => {
		const list = [1, 2, 3, 4].map((n) => project(`p${n}`, n, true));
		expect(selectFeatured(list)).toHaveLength(3);
	});

	it('returns an empty array when nothing is featured', () => {
		expect(selectFeatured([project('a', 1)])).toEqual([]);
	});
});

describe('readingTime', () => {
	const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');

	it('rounds up at 200 words per minute', () => {
		expect(readingTime(words(200))).toBe(1);
		expect(readingTime(words(201))).toBe(2);
		expect(readingTime(words(401))).toBe(3);
	});

	it('counts words across newlines and repeated spaces', () => {
		expect(readingTime(`${words(150)}\n\n   ${words(100)}`)).toBe(2);
	});

	it('is at least 1 minute, even for empty bodies', () => {
		expect(readingTime('')).toBe(1);
		expect(readingTime(undefined)).toBe(1);
	});
});

describe('date formatting', () => {
	it('formats dates in UTC', () => {
		expect(formatDate(new Date('2026-10-18'))).toBe('Oct 18, 2026');
		expect(formatDate(new Date('2026-01-01T00:00:00Z'))).toBe('Jan 1, 2026');
	});

	it('produces ISO calendar dates', () => {
		expect(isoDate(new Date('2026-10-18'))).toBe('2026-10-18');
	});

	it('formats year-month values', () => {
		expect(formatYearMonth('2023-07')).toBe('Jul 2023');
		expect(formatYearMonth('2019-12')).toBe('Dec 2019');
		expect(formatYearMonth('present')).toBe('Present');
	});
});

describe('paragraphs', () => {
	it('splits on blank lines, trims, and drops empty paragraphs', () => {
		expect(paragraphs('First line\nstill first\n\n  Second  \n\n\n')).toEqual(['First line\nstill first', 'Second']);
	});

	it('returns an empty array for blank text', () => {
		expect(paragraphs('  \n ')).toEqual([]);
	});
});
