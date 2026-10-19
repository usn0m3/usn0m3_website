import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { selectFeatured, selectPosts, sortProjects } from './content';

export type Post = CollectionEntry<'blog'>;
export type Project = CollectionEntry<'projects'>;
export type Profile = CollectionEntry<'profile'>['data'];

/** Published posts, newest first. Drafts are included only in `astro dev`. */
export async function getPosts(): Promise<Post[]> {
	return selectPosts(await getCollection('blog'), { includeDrafts: import.meta.env.DEV });
}

export async function getProjects(): Promise<Project[]> {
	return sortProjects(await getCollection('projects'));
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
	return selectFeatured(await getCollection('projects'), limit);
}

export async function getProfile(): Promise<Profile> {
	const entry = await getEntry('profile', 'main');
	if (!entry) throw new Error('src/data/profile.yaml is missing or empty.');
	return entry.data;
}
