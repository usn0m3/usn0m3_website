import { z } from 'astro/zod';

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
});
