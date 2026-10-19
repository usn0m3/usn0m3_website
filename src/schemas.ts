import { z } from 'astro/zod';

const yearMonth = z
	.string()
	.regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use "YYYY-MM" in quotes, for example "2023-07"');
const endYearMonth = z.union([yearMonth, z.literal('present')]);

// Unquoted YAML dates arrive as Date objects; quoted ones as ISO strings.
// No coercion: a blank value (null) or a bare number must fail, not become 1970.
const contentDate = z
	.union([z.date(), z.iso.date(), z.iso.datetime({ offset: true })], {
		error: 'Use a date like 2026-10-18',
	})
	.transform((value) => (value instanceof Date ? value : new Date(value)));

export const postSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	pubDate: contentDate,
	updatedDate: contentDate.optional(),
	tags: z.array(z.string()).default([]),
	draft: z.boolean().default(false),
});

export function projectSchema<I extends z.ZodType>(image: () => I) {
	return z.object({
		title: z.string().min(1),
		summary: z.string().min(1),
		stack: z.array(z.string()).min(1),
		repo: z.url().optional(),
		demo: z.url().optional(),
		cover: image().optional(),
		featured: z.boolean().default(false),
		order: z.number().default(100),
	});
}

export const profileSchema = z.object({
	name: z.string().min(1),
	role: z.string().min(1),
	location: z.string().min(1),
	headline: z.string().min(1),
	intro: z.string().min(1),
	bio: z.string().min(1),
	email: z.email(),
	links: z.object({
		github: z.url(),
		linkedin: z.url().optional(),
	}),
	skills: z.array(z.object({ group: z.string().min(1), items: z.array(z.string()).min(1) })),
	experience: z.array(
		z.object({
			company: z.string().min(1),
			role: z.string().min(1),
			start: yearMonth,
			end: endYearMonth,
			summary: z.string().min(1),
			highlights: z.array(z.string()).default([]),
		}),
	),
	education: z.array(
		z.object({
			school: z.string().min(1),
			degree: z.string().min(1),
			start: yearMonth,
			end: endYearMonth,
		}),
	),
});
