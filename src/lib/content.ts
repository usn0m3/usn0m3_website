type DatedEntry = { data: { pubDate: Date; draft: boolean } };
type OrderedEntry = { data: { title: string; order: number; featured: boolean } };

const WORDS_PER_MINUTE = 200;

export function selectPosts<T extends DatedEntry>(posts: readonly T[], opts: { includeDrafts: boolean }): T[] {
	return posts
		.filter((post) => opts.includeDrafts || !post.data.draft)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export function sortProjects<T extends OrderedEntry>(projects: readonly T[]): T[] {
	return [...projects].sort(
		(a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'en'),
	);
}

export function selectFeatured<T extends OrderedEntry>(projects: readonly T[], limit = 3): T[] {
	return sortProjects(projects.filter((project) => project.data.featured)).slice(0, limit);
}

export function readingTime(body: string | undefined): number {
	const words = (body ?? '').split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
	timeZone: 'UTC',
});

export function formatDate(date: Date): string {
	return dateFormat.format(date);
}

export function isoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export function paragraphs(text: string): string[] {
	return text
		.split(/\n\s*\n/)
		.map((part) => part.trim())
		.filter(Boolean);
}
